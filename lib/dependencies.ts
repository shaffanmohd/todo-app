import { Todo } from "@/lib/models/Todo";

/**
 * Checks whether setting `dependsOn` on the todo identified by `todoId`
 * would create a circular dependency chain.
 *
 * Only meaningful when `todoId` refers to an existing todo (i.e. during
 * updates) — a brand-new todo can't be part of a cycle since nothing
 * can reference an ID that doesn't exist yet.
 */
export async function wouldCreateCycle(
  todoId: string,
  dependsOn: string[],
): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [...dependsOn];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    if (currentId === todoId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = await Todo.findById(currentId)
      .select("dependsOn")
      .lean<{ dependsOn: { toString(): string }[] } | null>();

    if (current?.dependsOn) {
      queue.push(...current.dependsOn.map((id) => id.toString()));
    }
  }

  return false;
}

/**
 * Given a list of dependency todo IDs, returns true if all of them
 * currently have status "Completed". Used to gate the "In Progress" transition.
 */
export async function areAllDependenciesCompleted(
  dependsOn: string[],
): Promise<boolean> {
  if (dependsOn.length === 0) return true;

  const incomplete = await Todo.countDocuments({
    _id: { $in: dependsOn },
    status: { $ne: "Completed" },
  });

  return incomplete === 0;
}
