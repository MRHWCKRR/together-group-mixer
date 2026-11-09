# Together

A browser-based random group generator for classrooms and teams.

[Use the app](https://together-group-mixer.vercel.app/)

## Run locally

No dependencies or build step. Serve this directory over HTTP:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000.

## How it works

- Enter one name per line.
- Optionally nominate people who would prefer to be together.
- Choose the number of groups or people per group, then generate groups.
- Nominations are preferences, not guarantees. Each shuffle can split connected chains while balancing group sizes.

`groups.mjs` contains the grouping logic; `app.mjs` connects it to the page. Names and settings are stored in the browser's local storage. No backend or account is required.

## License

MIT — see [LICENSE](LICENSE).
