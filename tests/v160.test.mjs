// v160: Help & videos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { app, baseState } from "./harness.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("tenants only get the tenant videos; owners get all of them, theirs first", () => {
  const owner = app.helpVideosFor("owner");
  const tenant = app.helpVideosFor("tenant");
  assert.equal(owner.length, app.HELP_VIDEOS.length);
  assert.equal(owner[0].id, "tour");
  assert.ok(tenant.length > 0);
  assert.ok(tenant.every((v) => v.role === "tenant"));
});

test("video lengths read as m:ss", () => {
  assert.equal(app.formatVideoLength(61), "1:01");
  assert.equal(app.formatVideoLength(9.6), "0:10");
  assert.equal(app.formatVideoLength(0), "0:00");
});

test("every listed video and poster exists in both languages", () => {
  for (const lang of ["en", "ar"]) {
    for (const v of app.HELP_VIDEOS) {
      for (const ext of ["mp4", "jpg"]) {
        const file = `${root}videos/${lang}/${v.id}.${ext}`;
        assert.ok(existsSync(file), `missing ${lang}/${v.id}.${ext}`);
        assert.ok(statSync(file).size > 1000, `empty ${lang}/${v.id}.${ext}`);
      }
    }
    assert.ok(app.HELP_VIDEOS.every((v) => v.seconds[lang] > 0), `every ${lang} video has its length`);
  }
});

test("the tour reminder shows until the tour has been opened", () => {
  app.setState(baseState({}));
  localStorage.removeItem(app.HELP_WATCHED_KEY);
  assert.deepEqual(app.v160AttentionItems().map((i) => i.key), ["helpTour"]);
  localStorage.setItem(app.HELP_WATCHED_KEY, JSON.stringify(["tour"]));
  assert.deepEqual(app.v160AttentionItems(), []);
  localStorage.removeItem(app.HELP_WATCHED_KEY);
});
