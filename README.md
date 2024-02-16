# blog town

## updating blog

### Commands

* `hexo server` to run a local server
* `hexo new post "post title"` to create a new post
* `hexo new draft "draft title"` to create a new draft
* `hexo publish draft "draft title"` to publish a draft
* `hexo new page "page title"` to create a new page
  * `hexo new page --path about/me "About me"`
* `hexo help` to see all commands

### Deploying

* make updates in dev branch
  * `hexo new post rathole-tunnel-for-palworld`
  * `hexo server` to test
* still from dev branch
  * `hexo clean` need to clean if you updated stylus file for example
  * `hexo generate` to generate new static files
  * `hexo deploy` to deplo
