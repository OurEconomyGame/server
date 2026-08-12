import { getAllUsers } from "../db/gets.ts";
interface PublicUser {
  id: number;
  username: string;
  joined: number;
  active: number;
}
export async function getAllUsersPublicInfo(params: Record<string, unknown>) {
  const sortBy = params.sortBy;
  const users = await getAllUsers();

  const publicInfo: PublicUser[] = [];

  for (const user of users) {
    publicInfo.push({
      id: user.id,
      username: user.name,
      joined: user.created_at,
      active: user.last_accessed,
    });
  }
  switch (sortBy) {
    case "name":
      publicInfo.sort((a, b) => a.username.localeCompare(b.username));
      break;
    default:
      publicInfo.sort((a, b) => a.id - b.id);
      break;
  }
  return publicInfo;
}
