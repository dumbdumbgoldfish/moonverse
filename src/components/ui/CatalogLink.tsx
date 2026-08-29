"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CatalogLinkBase = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "compact";
  tone?: "paper" | "night";
};

type CatalogLinkProps = CatalogLinkBase &
  (
    | { href: string; onClick?: never; as?: never; type?: never; disabled?: never }
    | {
        href?: never;
        onClick?: () => void;
        as?: "button";
        type?: "button" | "submit";
        disabled?: boolean;
      }
    | { href?: never; onClick?: never; as: "span"; type?: never; disabled?: never }
  );

function catalogClassName({
  size = "default",
  tone = "paper",
  className,
}: Pick<CatalogLinkBase, "size" | "tone" | "className">) {
  return cn(
    "mv-catalog-link inline-flex items-center justify-center",
    size === "compact" && "mv-catalog-link--compact",
    tone === "night" && "mv-catalog-link--night",
    className
  );
}

export function CatalogLink(props: CatalogLinkProps) {
  const classes = catalogClassName(props);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {props.children}
      </Link>
    );
  }

  if ("as" in props && props.as === "span") {
    return <span className={classes}>{props.children}</span>;
  }

  if (props.type === "submit" || props.onClick) {
    return (
      <button
        type={props.type ?? "button"}
        className={cn(classes, props.disabled && "pointer-events-none opacity-50")}
        onClick={props.onClick}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    );
  }

  return <span className={classes}>{props.children}</span>;
}
