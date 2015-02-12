# classpass-scheduler

books classpass classes, because computers. ideally paired with `cron`

## config

### dependencies

You need `casperjs`.

```bash
npm install -g casperjs
```

then install modules

```bash
cd <wherever-you-cloned-the-repo> && npm install
```

## modes

There are two modes, `studio` (default) and `class`. `studio` mode attempts to book classes, given information about a studio and desired times; `class` mode takes specific classes as input and attempts to book them, in the order they're provided.

### `studio`

On the command line: `--mode=studio` (or omit `--mode` entirely; this is the default behavior).

All of the studios we'll try to book from are in the file specified in `--file` ([see below](#--filepathtofilejson); defaults to `./studios.json`). Create this file by copying over the example: `cp studios-example.json studios.json`

Fields for each studio:

- `name` (required, `String`) - whatever you want to call the studio
- `url_slug` (required, `String`) - the url slug of the studio: `http://classpass.com/<url_slug>`
- `attended` (optional, `Boolean`, default: `false`) - have you attended the studio before?
- `constraints` (optional, `Object`) - date and time constraints. if not present, will book anything (if available) at the given studio. fields:
    - `desired_dates` (optional, `Array` or `String`) - either an array of dates, each formatted `"YYYY-MM-DD"`, or a string beginning with a plus - how many days in the future. if not present, won't look at dates when filtering down available classes at this studio
    - `desired_times` (optional, `Array`) - array of desired times, each formatted `"(H)H:MM (a/p)m"`. if not present, won't look at times when filtering down available classes at this studio

So, for example (this is `./studios-example.json`):

```json
[
  {
    "name" : "human@ease",
    "url_slug" : "humanease-brooklyn",
    "constraints" : {
      "desired_dates" : "+5"
    }
  },
  {
    "name" : "bodyburn",
    "url_slug" : "brooklyn-bodyburn-williamsburg",
    "attended" : true,
    "constraints" : {
      "desired_dates" : "+7",
      "desired_times" : [ "6:00 pm", "7:00 pm" ]
    }

  },
  {
    "name" : "fhitting room",
    "url_slug" : "the-fhitting-room-new-york",
    "constraints" : {
      "desired_dates" : [ "2014-11-12", "2014-11-15" ],
      "desired_times" : [ "5:30 pm", "6:30 pm" ]
    }
  }
]

```

### `class`

On the command line: `--mode=class`

Just like for `studio` mode, `class` mode requires classes in the input file (specified in `--file`; [see below](#--filepathtofilejson)). Create the default file, `./classes.json`, by copying over the example: `cp classes-example.json classes.json`.

Fields for each class:

- `url` (required, `String`): full url of the class
- `studio` (optional, `String`): name of the studio
- `attended` (optional, `Boolean`, default: `false`): whether or not you've attended this studio

For example (from `classes-example.json`):

```json

[
  {
    "attended" : false,
    "url" : "http://classpass.com/syncstudio-bklyn-brooklyn/synccycling-the-basics-ygm7/77744902"
  }, {
    "studio" : "studio 360",
    "url" : "http://classpass.com/studio-360-new-york/sunrise-vinyasa-debd/77745885"
  }, {
    "url" : "http://classpass.com/brooklyn-bodyburn-cobble-hill/bodyburn-all-levels-0d57/78866279"
  }
]

```

## other options

### `--file=/path/to/file.json`

The path to the file (containing either studios or classes, as specified [above](#modes)). Optional. Default is `./studios.json` or `./classes.json`, depending on `mode`.

### `--wait=<int>`

Number of seconds to wait after logging in before attempting to book anything. e.g., `--wait=10` will wait 10 seconds (approximately--we're dealing with `setTimeout` here). Optional (default: no wait).

## running

```bash
casperjs classpass-scheduler.js --email='your.email@example.com' --password='yourClasspassPassword' [--mode=studio|class] [--file=/path/to/file.json] [--wait=<int>]
```
