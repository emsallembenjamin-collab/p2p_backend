module.exports = {
  apps : [{
    name        : "News server",
    script      : "index.js",
    watch       : true,
    merge_logs  : true,
    cwd         : "/var/www/news_website_backend_express/",
   }]
}