# Lichess API UI

Some web UIs for [the Lichess API](https://lichess.org/api)

## Try it out

[https://lichess.org/api/ui](https://lichess.org/api/ui)

## Run it on your machine

```bash
pnpm install
pnpm dev
```

### Build for production + preview

```bash
pnpm build
pnpm preview
```

## Tests

```bash
pnpm test
## or
pnpm test:watch
```

```bash
# run prettier
pnpm format

# check typescript
pnpm tsc
```

## Using a development instance of Lila

Open the browser console and run:

```js
localStorage.setItem('lichessHost', 'http://localhost:8080');

localStorage.setItem('lichessHost', 'https://lichess.dev');
```

Modify the CSP meta tag in `index.html` to include that domain.

Refresh and verify the configuration value in the footer.

To reset back to prod default, log out and it will clear localStorage.
