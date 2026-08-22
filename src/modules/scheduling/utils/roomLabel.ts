/**
 * How an unassigned room reads on a timetable.
 *
 * A schedule may legitimately have no room: a department that owns none has its
 * classes placed with the course and the time only, for a coordinator to fill in
 * later. That is a real state, not missing data, so it needs a name a reader
 * recognises rather than a dash, a blank cell, or three different words
 * depending on which screen they are looking at — which is what it was.
 */
export const NO_ROOM_ASSIGNED = 'NRA';

/** The compact room embed every schedule carries. */
interface RoomRef {
    name?: string | null;
    code?: string | null;
}

/**
 * A room's display name, or `NRA` when none is assigned.
 *
 * Falls back to the room's CODE before giving up: a room row always has a code,
 * while `name` is nullable, and "NB-301" is a better answer than "no room" for a
 * room that plainly exists.
 *
 * @param room the schedule's room embed, if any
 * @returns the room label, or NRA
 */
export function roomLabel(room?: RoomRef | null): string {
    const label = room?.name?.trim() || room?.code?.trim();

    return label || NO_ROOM_ASSIGNED;
}
