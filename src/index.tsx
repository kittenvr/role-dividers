import React from "react";
import { Injector, webpack } from "replugged";
import SPACER_CHARACTER_SET from "./chars";
import "./divider.css";

const MIN_DIVIDER_CHARACTERS = 2;
const HIDE_EMPTY = true; // todo: settings

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join("")}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(`^(${SPACERS_REGEX_TEXT})?(.+?)(${SPACERS_REGEX_TEXT})?$`);

const inject = new Injector();

type RoleArg = Record<string, unknown> & {
  role: Record<string, unknown> & { name: string; id: string };
};

export async function start(): Promise<void> {
  const roleMod = await webpack.waitForModule(
    webpack.filters.bySource(/\w+\.canRemove,\w+=\w+\.className/),
  );
  if (!roleMod) return;
  const renderExport = webpack.getExportsForProps<
    "render",
    {
      // eslint-disable-next-line no-unused-vars
      render: (role: RoleArg) => React.ReactElement;
    }
  >(roleMod, ["render"]);
  if (!renderExport) return;

  const titleClass = webpack
    .getByProps(["title", "body"], { all: true })
    .find(
      (x) =>
        Object.keys(x).length === 2 &&
        typeof x.title === "string" &&
        typeof x.body === "string" &&
        x.title.startsWith("title-") &&
        x.body.startsWith("body-"),
    );
  if (!titleClass) return;
  const eyebrowClass = webpack.getByProps("eyebrow");
  if (!eyebrowClass) return;
  const headerClass = [
    titleClass.title as string,
    eyebrowClass.eyebrow as string,
    "role-divider",
    HIDE_EMPTY ? "hide-empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  inject.instead(renderExport, "render", (args, fn) => {
    const [{ role }] = args;
    const match = role.name.match(REGEX);
    const [, frontSpace, roleName, backSpace] = match || [];
    const isMatch = Boolean(frontSpace || backSpace);
    if (isMatch) {
      return <h2 className={headerClass}>{roleName}</h2>;
    }
    return fn(...args);
  });
}

export function stop(): void {
  inject.uninjectAll();
}
