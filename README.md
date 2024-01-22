# Lichess API UI

Some web UIs for [the Lichess API](https://lichess.org/api)

## Try it out

[https://lichess.org/api/ui](https://lichess.org/api/ui)

## Run it on your machine

```bash
pnpm install
pnpm build # or pnpm watch
pnpm serve
```

## Tests

```bash
pnpm test
## or
pnpm test:watch
```

## Using a development instance of Lila

Open the browser console and run:

```js
localStorage.setItem('lichessHost', 'http://localhost:8080');
```

Modify the CSP meta tag in `index.html` to add that domain. For example, change `lichess.org` to `localhost:8080`.

Refresh and verify the configuration value in the footer.
