export const formatTrackCount = (n = 0) => `${n} track${n === 1 ? "" : "s"}`;
export const isOwnerOfPlaylist = (playlist) => !!playlist?.viewer?.isOwner;
export const hasSavedPlaylist = (playlist) => !!playlist?.viewer?.hasSaved;
