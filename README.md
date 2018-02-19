
# Fubra Cookie Bar

---

## Building distribution files

```
cd path/to/fubracookiebar
npm install
npm install -g gulp
gulp build
```


## Adding cookies bar to page
```
<script>
  window.fubracookiebar_options = {

      message:
        'This website uses cookies to ensure you get the best experience. ',

      learnMore:
        'Learn More',

      moreText:
        'In common with most websites, we use cookies to personalise the content and adverts that you see, to provide social media features and to help analyse our traffic. We also share basic information about your use of our site with our social media, advertising and analytics partners, such as Facebook, Twitter, and Google.',

      dismiss:
        'Got it!'
  }
</script>
<script defer type="text/javascript" src="path/to/dist/fubracookiebar.min.js"></script>
```

![alt tag](https://github.com/fubralimited/fubracookiebar/blob/master/screenshot.png)
