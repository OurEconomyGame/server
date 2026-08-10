import { getUserByName } from "../db/gets.ts";
import { createSession } from "../sessions/create.ts";

export async function login(params: unknown) {
  if (!params || typeof params !== "object") {
    return { status: "INVALID INPUT", id: 0 };
  }
  const paramsObj = params as Record<string, unknown>;
  if (
    typeof paramsObj.hi !== "string" ||
    typeof paramsObj.secret !== "string"
  ) {
    return { status: "are you an idiot?", token: "none" };
  }
  const user = await getUserByName(paramsObj.hi);
  if (user === null)
    return { status: "dont try gaslighting reality", token: "none" };
  const knowsTheSecretCode = await Bun.password.verify(
    paramsObj.secret,
    user.pass_hash,
  );

  if (knowsTheSecretCode) {
    const token = createSession(user.id);
    return {
      status: "wow!!! You remembered your password, cool, kudos",
      token: token,
    };
  }
  return {
    status: "did you forget your password or are you a robber!",
    token:
      "well, if you are a robber, and you do get in, then this user has a really really really poor password",
  };
}
