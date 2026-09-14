import {Todo, type ITodo} from "@/lib/models/Todo";

/**
 * Checks whether setting `dependsOn` on the todo identified by `todoId`
 * would create a circular dependency chain. Scoped to `userId` since a
 * todo can only ever depend on the same user's own todos.
 */
export async function wouldCreateCycle(
  todoId: string,
  dependsOn: string[],
  userId: string,
): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [...dependsOn];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    if (currentId === todoId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = await Todo.findOne({_id: currentId, userId})
      .select("dependsOn")
      .lean<Pick<ITodo, "dependsOn"> | null>();

    if (current?.dependsOn) {
      queue.push(...current.dependsOn.map((id) => id.toString()));
    }
  }

  return false;
}

/**
 * Given a list of dependency todo IDs, returns true if all of them
 * currently have status "Completed". Scoped to userId for the same reason.
 */
export async function areAllDependenciesCompleted(
  dependsOn: string[],
  userId: string,
): Promise<boolean> {
  if (dependsOn.length === 0) return true;

  const incomplete = await Todo.countDocuments({
    _id: {$in: dependsOn},
    userId,
    status: {$ne: "Completed"},
  });

  return incomplete === 0;
}
