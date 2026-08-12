import { getAllUsers } from "../db/gets.ts";
export async function getAllUsersPublicInfo() {
  const users = await getAllUsers();

  const publicInfo = [];

  for (const user of users) {
    publicInfo.push({
      username: user.name,
      joined: user.created_at,
      active: user.last_accessed,
    });
  }
  return publicInfo;
}
