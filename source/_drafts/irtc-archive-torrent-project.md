---
title: Creating The Internet Raytracing Competition (IRTC) Archive
date: 2023-07-03 19:00:59
tags:
  - cgi
  - internet raytracing competition
  - data archival
  - data science from the command line
  - infopunk
---

[The Internet Ray Tracing Competition](https://www.irtc.org/) was an open competition held every two months from 1996 to 2006. It was a continuation of [Matt Kruse's Raytracing Competition](https://www.irtc.org/old/) which was held from 1994 to 1995. Competitors were allowed to use any 3D rendering program they desired. All submissions needed to include a text file describing how the image was created as well as what program was used. This is great for us, because we can parse these descriptions and generate a cool graph that shows the usage of different 3D rendering software over time!

There were multiple ways to submit an entry. You could connect directly to their ftp server and upload your submission, email them, or you could submit your entry via their website, [which was a set of cgi scripts to handle submission uploads](https://web.archive.org/web/20050623200137/http://irtc.org/cgi-bin/irtc_submit_stills). The "cgi" here refers to common gateway interface. CGI scripts were one of the earliest ways to create interactive websites and process forms. It's an interesting peek into the past.

There were some rules that changed over the life of the contest. Originally there was a size constraint on the images themselves. 800x600 was both the recommended size and the largest the competition allowed. After some time, there was no image size restriction, but there was a file size maximum of 250kb (wow!) introduced sometime in 2000. This limit remained till the end of the competition. Even though there was no original file size limit, the competition rules did mention file size:

> and there is no size restriction, but please remember that hard disk space is not infinite

I love how free and open and kind the early internet was. There were definitely some mischiefs and destructive hackers, but for the most part people did not want to wreak havoc. They were on the internet to talk to others with similar interests, learn, and create. There was no economic or political benefit in DDOSing a cgi competition or filling their servers with spam data or worse, so no one bothered. Unfortunately, that lack of economic and political incentive no longer stops bad actors, trolls, and bots from causing destruction.

You can read all the rules of the competition [here](https://web.archive.org/web/20070129230359/http://www.irtc.org/stills/rules.html).

## Why?

* I don't own any of this content. I am simply sharing it with the world and ensuring it is not lost to time.
* It is a personally interesting piece of internet history that I wanted to preserve.
* It was a simple introduction to data archival.
* Enabled fun project ideas:
    * I built a silly [image labeler/classifier tool](https://github.com/steezeburger/image-multi-label-classifier-django) to help me label these images for categorization purposes.
    * [I try to share my favorite submissions every few weeks/months](https://www.instagram.com/a_cgi_steezeburger/).
    * I think another fun project would be to run some analysis on the styles and themes used and see how they change over time.

## How?

### Scraping

The content was extremely easy to "scrape" due to the fact that it is all hosted on a public FTP server, so we can just use `wget` to download all the files recursively.

```bash
wget -r --no-parent -m ftp://ftp.irtc.org/pub/
```

### Creating the .torrent

Creating the .torrent file required [mktorrent](https://github.com/pobrn/mktorrent). I wrote a simple bash script to keep things more readable.

```bash
#!/bin/bash

torrent_name=internet_raytracing_competition_archive_full
trackers=http://tracker.opentrackr.org:1337/announce
data_src=data/ftp.irtc.org/internet_raytracing_competition_archive_full

mktorrent -v \
  --output=${torrent_name}.torrent \
  --name="${torrent_name}" \
  --announce="${trackers}" \
  ${data_src}
```

The torrent file is available in [the repo I created for this post](https://github.com/steezeburger/irtc-archive-torrent-project). If you are having trouble finding peers, you might try adding trackers from [this list](https://thomas.vanhoutte.be/miniblog/free-open-and-working-torrent-tracker-list-for-2023/).

## Software Trends

It would be cool to compare the usage of the different 3d software used in the competition. There are several questions I want to answer:

* Which program was the most popular overall?
* Which program was the most popular in each year?
* Which program was the least popular?
* Can we create a grouped bar chart from this data to show trends of usage over time?

### Parsing the data

* We first want to extract the software used from the description files
    * Software/tools used
    * Submission month and year
    * use [jsonl](https://jsonlines.org/)
      * e.g. `{"filename": "test.txt", "year": 1996, "month": 1, "software": ["POV-Ray 3.0 beta 7b (DOS)", "PaintShopPro 3.0"]}`
      * other keys:
        * `title`
        * `name`
        * `country`
        * `email`?
        * `webpage`
        * `topic`
        * `hardware`
        * `image_description`
        * `technique_description`
        * ... more will be added here as I go through the different description files from different time periods
    * let's try parsing the whole description file into a `jsonl` row

(TODO)

* show script that parses descriptions and counts software used
* include cool ascii graph of software used over time
