import { StackHandler, StackServerApp } from "@stackframe/stack";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});

export default function Handler(props: unknown) {
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
