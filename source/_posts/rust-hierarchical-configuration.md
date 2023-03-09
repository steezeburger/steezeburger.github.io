---
title: Rust Hierarchical Configurations from Files, Environment Variables, and CLI Args with Figment and Clap.
date: 2023-03-08 19:24:48
tags:
- rust
- figment
- clap
- configuration
- cli
---

## Why?

I've been working with Rust lately and I recently needed to implement a program where the configuration could be set through a file, environment variables, and cli args, with the latter overriding the former.

This is called a hierarchical configuration, and it is the recommended way of handling configuration in your applications.

There are several benefits to using hierarchical configuration. A few of them are:

* **Easier testing** - you can easily test your app with different configurations and in different environments. e.g. cli w/ cli args, ide w/ file, cloud environments w/ environment variables, etc.

* **Improved portability** - you can easily override single configuration values for deployment to any environment. [12 Factor App](https://12factor.net/) recommends setting configuration values with environment variables. This is no problem with the setup I recommend.

* **Flexibility** - you can provide different levels of configuration customization for different users for different use cases, e.g. you can provide default configuration for most users but let power users override these values with environment variables or command line arguments.


Figment has some suggestions for how to use it with Clap, but their example did not fit my use case, and I had trouble finding examples of how to implement this properly. That is why I decided to write this blog post!


## How?

There are a few Rust crates that support hierarchical configurations. I chose [Figment](https://crates.io/crates/figment) after it was recommended by a coworker. We also need [Clap](https://crates.io/crates/clap) for command line argument parsing and [Serde](https://crates.io/crates/serde) for serialization of these command line arguments so that the argument values will be deserialized into the correct Rust types.

Figment actually has a nice little section in the [documentation](https://docs.rs/figment/0.10.8/figment/#for-cli-application-authors) that explains how to use Figment with Clap, but there are a few differences with how they set up their configurations. They chose to load the configurations in a different order than is recommended for hierarchical configurations.

```rust
use clap::Parser;
use figment::{Figment, providers::{Serialized, Toml, Env, Format}};
use serde::{Serialize, Deserialize};

#[derive(Parser, Debug)]
struct Config {
   /// Name of the person to greet.
   #[clap(short, long, value_parser)]
   name: String,

   /// Number of times to greet
   #[clap(short, long, value_parser, default_value_t = 1)]
   count: u8,
}

// Parse CLI arguments. Override CLI config values with those in
// `Config.toml` and `APP_`-prefixed environment variables.
let config: Config = Figment::new()
    .merge(Serialized::defaults(Config::parse()))
    .merge(Toml::file("Config.toml"))
    .merge(Env::prefixed("APP_"))
    .extract()?;
```

Their ordering is `cli args < file < environment variables`, but we want `file < environment variables < cli args`. We could simply reorder the `merge` calls. Let's try that.

```rust
// Parse CLI arguments. Override CLI config values with those in
// `Config.toml` and `APP_`-prefixed environment variables.
let config: Config = Figment::new()
    .merge(Toml::file("Config.toml"))
    .merge(Env::prefixed("APP_"))
    .merge(Serialized::defaults(Config::parse()))
    .extract()?;
```

However, this causes an issue. This will force you to use command line arguments, because if you don't, the values would be `None`, but your `Config` struct's values are not `Option<T>`, so they can't be `None`. Your code will panic! Okay, so what if we refactored `Config` to use `Option<T>`s?

```rust
#[derive(Parser, Debug)]
struct Config {
    /// Name of the person to greet.
    #[clap(short, long, value_parser)]
    name: Option<String>,

    /// Number of times to greet
    #[clap(short, long, value_parser, default_value_t = 1)]
    count: Option<u8>,
}
```

We now run into another issue. If we called the program without command line arguments specified, the `Config`'s values would be `None`. This would override the previous configuration values set by the file or environment variables with `None`! This means we are still basically forced to use command line arguments.

## Final Solution

The final solution required adding a separate struct to handle the command line arguments, along with a helper from `Serde` that let's use skip serialization of values if they are `None`.

```rust
// cli.rs
use clap::Parser;
use serde::Serialize;

#[derive(Debug, Parser, Serialize)]
pub(crate) struct Cli {
    /// The name 
    #[arg(long = "name")]
    #[serde(skip_serializing_if = "::std::option::Option::is_none")]
    pub(crate) name: Option<String>,

    /// The count
    #[arg(long = "count")]
    #[serde(skip_serializing_if = "::std::option::Option::is_none")]
    pub(crate) count: Option<u8>,
}
```

Notice the `#[serde(skip_serializing_if = "::std::option::Option::is_none")]`! This means the value will not be included in the serialized struct if it was not set on the command line.

```rust
// config.rs
use serde::{Deserialize, Serialize};

/// The global configuration for the driver and its components.
#[derive(Serialize, Deserialize)]
pub(crate) struct Config {
    /// The name
    pub(crate) name: String,

    /// The count
    pub(crate) count: u8,
}

```

```rust
use clap::Parser;
use color_eyre::eyre::Result;
use figment::{
    Figment,
    providers::{Env, Format, Serialized, Toml},
};

// main.rs
use crate::cli::Cli;
use crate::config::Config;

pub(crate) mod cli;
pub(crate) mod config;

pub async fn run() -> Result<()> {
    // hierarchical config. cli args override envars which override toml config values
    let conf: Config = Figment::new()
        .merge(Toml::file("Config.toml"))
        .merge(Env::prefixed("APP_"))
        .merge(Serialized::defaults(Cli::parse()))
        .extract()?;
```

Now we can elegantly set configuration values with Toml files, environment variables, and command line arguments in a sane way!

You can see a full example in action in this repo I am currently working on at my new company, [Astria](https://astria.org/).

https://github.com/astriaorg/astria-conductor

Feel free to follow me on [Github](https://github.com/steezeburger) or shoot me an e-mail! My e-mail address can be found on my Github profile.
