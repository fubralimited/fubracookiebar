
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
  window.fubracookiesbar_options = {
      message: 'This website uses cookies to ensure you get the best experience. ',
      link: null,
      learnMore: 'Learn More',
      dismiss: 'Got it!'
  }
</script>
<script defer type="text/javascript" src="path/to/dist/fubracookiebar.min.js"></script>
```

![alt tag](https://github.com/fubralimited/fubracookiebar/blob/master/screenshot.png)
