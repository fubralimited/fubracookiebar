
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
    message: 'This website uses cookies to ensure you get the best experience. ',
    button: 'Accept and Close',
    more: 'Learn More',
    link: '/privacy-policy.html'
}
</script>
<script defer type="text/javascript" src="path/to/dist/fubracookiebar.min.js"></script>
```

![alt tag](https://github.com/fubralimited/fubracookiebar/blob/master/screenshot.png)
