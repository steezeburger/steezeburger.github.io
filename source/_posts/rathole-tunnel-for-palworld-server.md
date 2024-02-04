---
title: "Rathole Tunnel: Securely and Cheaply Expose Local Palworld Server"
date: 2024-02-03 10:30:00
tags:
- palworld
- self-hosting
- docker
- rathole
# - palworld-dedicated-server
# - palworld-server-docker
# - docker-compose
# - devops
# - reverse-tunnel
# - nat
# - proxy
# - port-forwarding
# - digital-ocean
---

## Why?

The biggest reason I needed to run a reverse tunnel was to get around NAT issues, but there are several benefits:
* I wanted to run a multiplayer game server for a recently popular game called [Palworld](https://store.steampowered.com/app/1623730/Palworld/)
* I wanted to run the Palworld server on my local, beefy gaming maching
* I had an issue with NAT at my router
  * I was not able to access my game server from within my local network using its public IP. This is a common issue with NAT, and not all routers support the feature to get around this issue. The router feature is called "NAT loopback" or "NAT hairpinning", but my xfinity router did not support it.
    * Here are some links to get a better understanding of the issue:
      * <https://help.mikrotik.com/docs/display/ROS/NAT#NAT-HairpinNAT>
      * <https://forums.xfinity.com/conversations/your-home-network/unable-to-connect-to-web-server-inside-my-network-with-port-forwarding/6323bf7e48c60d55e605064b?commentId=6329d82681a02c6d08bfc103>
  * ultimately, I could still access my server using its local IP, but I was using port forwards to give my friends access. Not the most secure
* I did not want to expose my local machine to the internet via port forwarding or DMZ
* I did not want to pay more than $5/month for a solution

## How?

* local Palworld server
  * Ubuntu 22.04 via WSL2 on my Windows gaming machine
  * [palworld-server-docker](https://github.com/thijsvanloef/palworld-server-docker)
* [Rathole](https://github.com/rapiz1/rathole) tunnel
  * Rathole is a reverse tunneling tool that allows you to easily expose local services to the internet. It's written in Rust and very fast. It's similar to `localtunnel` or `ngrok`, but it's open source and you run your own server.
  * Rathole server running on a remote VPS
    * I went with the cheapest DigitalOcean droplet, ~$4/month
    * My goal was to get a publicly accesible box up quickly. You could probably run Rathole on a Raspberry Pi, and this could be a good solution if you already have an rpi running at home and exposed publicly to the internet.
  * Rathole client running on my local machine

## Final Solution

### Rathole Server
* Create new droplet on Digital Ocean (DO)
> I am using Digital Ocean because I am familiar with it, but any cheap VPS should work. We're only running a tunnel on this box, not the game server itself.
  * Create a new project if you do not already have a DO project
  * Create a new droplet
    * Choose a region that is a decent middle ground between you and your friends or expected server members.
    * Leave the default datacenter (unless you have other plans for this droplet and need [specific features that are only available in certain datacenters](https://docs.digitalocean.com/products/platform/availability-matrix/))
    * I always choose the most recent LTS (long term support) version of Ubuntu, "22.04 (LTS) x64" at time of writing.
    * Droplet type should be "shared cpu"
    * CPU options > Regular, Disk Type: SSD
    * Then choose the cheapest, $4/month option
    * No need to add a volume
    * Add your ssh key
      * [How to add an SSH key to your DigitalOcean account](https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/)
    * Can change hostname to whatever you like, I went with `rathole`
    * Can use any tags you want, e.g. `rathole`, `reverse-tunnel`, `palworld`, etc
* Once the droplet has finished provisioning, ssh into it. The droplet IP will be shown on the droplets dashboard on the DO website
  * `ssh root@<droplet-ip>` - you'll be authenticated via the ssh key you added to the droplet
  * generally a good idea to upgrade the system after first login
    * `sudo apt update && sudo apt upgrade -y`
    * probably want to reboot after `sudo reboot` (note: you'll lose connection and need to ssh back in!)
* Install Docker
  * Some linux distributions come with unofficial docker packages, but it's [recommended to install from the official docker repository](https://docs.docker.com/engine/install/ubuntu/)
  ```bash
  # add Docker's official GPG key:
  sudo apt-get update
  sudo apt-get install ca-certificates curl
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc

  # Add the repository to Apt sources:
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update

  # Install docker and related packages
  sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  ```
* Create a project directory and necessary files
  * Create directory and files
  ```bash
  mkdir ~/rathole-palworld
  # docker-compose configuration
  touch ~/rathole-palworld/docker-compose.yaml
  # rathole server configuration
  touch ~/rathole-palworld/server.toml
  ```
  * Populate `docker-compose.yaml`
  ```yaml
  # docker-compose.yaml
  services:
    palworld-rathole-server:
      restart: unless-stopped
      container_name: palworld-rathole-server
      image: rapiz1/rathole
      command: ["--server", "/app/server.toml"]
      ports:
        - 2333:2333  # for rathole communication
        - 8211:8211/udp  # for palworld communication
        - 27015:27015/udp  # for steam client communication
      volumes:
        - ./server.toml:/app/server.toml
  ```
  * Populate `server.toml`
  ```toml
  # server.toml
  [server]
  bind_addr = "0.0.0.0:2333" # `2333` specifies the port that rathole listens for clients
  default_token = "use_a_secret_that_only_you_know"

  [server.services.palworld]
  type = "udp"
  bind_addr = "0.0.0.0:8211"
  nodelay = true

  [server.services.palworld2]
  type = "udp"
  bind_addr = "0.0.0.0:27015"
  nodelay = true
  ```
* Run Rathole server via docker compose
```bash
# starts the rathole server in the foreground
docker compose up
```
  * Helpful docker-compose commands
    * `docker compose up -d` - start the server in the background
    * `docker compose down` - stop the server
    * `docker compose logs -f` - view the server logs
    * `docker compose logs -f palworld-rathole-server` - view the server logs by container name

### Rathole Client

> NOTE: We are now going to be running a client on the same machine as the game server! So you'll be running commands in a WSL/Ubuntu terminal session that's running on your local machine now.

* Create directory and files for Rathole client
```bash
 mkdir ~/rathole-palworld
# docker-compose configuration
touch ~/rathole-palworld/docker-compose.yaml
# rathole server configuration
touch ~/rathole-palworld/client.toml
```
* Populate `docker-compose.yaml`
```yaml
services:
  palworld-rathole-client:
    restart: unless-stopped
    container_name: palworld-rathole-client
    image: rapiz1/rathole
    command: ["--client", "/app/client.toml"]
    network_mode: host
    volumes:
      - ./client.toml:/app/client.toml
```
* Populate `client.toml` - make sure to replace `your.digital.ocean.ip` with the IP of your droplet! And the `default_token` needs to match the `default_token` in your Rathole server's `server.toml`
```toml
# client.toml
[client]
remote_addr = "your.digital.ocean.ip:2333" # The address of the server. The port must be the same with the port in `server.bind_addr`
default_token = "use_a_secret_that_only_you_know"
retry_interval = 1

[client.services.palworld]
local_addr = "127.0.0.2:8211"
type = "udp"
nodelay = true

[client.services.palworld2]
local_addr = "127.0.0.2:27015"
type = "udp"
nodelay = true
```
* Run Rathole client via docker compose
```bash
# starts the rathole client in the foreground
docker compose up
```
* Test connection
  * You should now be able to connect to your Palworld server using the IP of your DigitalOcean droplet. In the Palworld mulitplayer server page, you will input something that looks like `123.123.123.90:8211`, where the left side of the colon is the IP address of your DigitalOcean droplet.

## Final Notes

This solution works well to get around NAT issues and expose a local game server to the internet without exposing anything else. It's more secure than port forwarding or DMZ, and it's still quite cheap. It's been working well for my friends and I, and I hope it works well for you. I created a Github repository to help you get started with this solution. You can find it [here](https://github.com/steezeburger/palworld-rathole-docker-compose).

You can leave an issue on the repo, or you can find out how to contact me on my [Github profile](https://github.com/steezeburger) if you need any help or have any questions! You can also leave a comment on this blog post if you are logged into Github.

Thanks for taking the time to read this post, and I hope it helps you out!

---
Palworld things I'm working on:
* [Palworld rathole docker compose repo](https://github.com/steezeburger/palworld-rathole-docker-compose)
* [Palworld server analytics bot + dashboard](https://github.com/steezeburger/palguybuddydude)
