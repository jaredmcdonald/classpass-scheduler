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

### studio setup

All of the studios we'll try to book from are in `studios.json`. Create this file by copying over the example: `cp studios-example.json studios.json`

Fields for each studio:

- `name` (required, `String`) - whatever you want to call the studio
- `url_slug` (required, `String`) - the url slug of the studio: `http://classpass.com/<url_slug>`
- `attended` (optional, `Boolean`; defaults to `false`) - have you attended the studio before?
- `constraints` (optional, `Object` - date and time constraints. if not present, will book anything (if available) at the given studio. fields:
    - `desired_dates` (optional, `Array` or `String`) - either an array of dates, each formatted `"YYYY-MM-DD"`, or a string beginning with a plus - how many days in the future. if not present, won't look at dates when filtering down available classes at this studio
    - `desired_times` (optional, `Array`) - array of desired times, each formatted `"(H)H:MM (a/p)m"`. if not present, won't look at times when filtering down available classes at this studio

So, for example (this is `studios-example.json`):

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


## running

```bash
casperjs classpass-scheduler.js your.email@example.com yourClasspassPassword
```

Or you can make it executable.
```bash
chmod +x classpass-scheduler.js && ./classpass-scheduler.js your.email@example.com yourClasspassPassword
```
