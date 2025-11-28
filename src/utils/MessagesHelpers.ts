import { Message } from "../types";

type MessagePosition = "single" | "first" | "middle" | "last";

export const getBubbleRounding = (
  position: MessagePosition,
  isMe: boolean,
): string => {
  const base = "rounded-2xl";

  if (position === "single") {
    return base;
  }

  if (isMe) {
    // Right-aligned messages (Me)
    if (position === "first") return `${base} rounded-br-sm`;
    if (position === "middle") return `${base} rounded-r-sm`;
    if (position === "last") return `${base} rounded-tr-sm`;
  } else {
    // Left-aligned messages (Friend)
    if (position === "first") return `${base} rounded-bl-sm`;
    if (position === "middle") return `${base} rounded-l-sm`;
    if (position === "last") return `${base} rounded-tl-sm`;
  }

  return base;
};

export const isInSameGroup = (
  index1: number,
  index2: number,
  messages: Message[],
): boolean => {
  if (
    index1 < 0 ||
    index2 < 0 ||
    index1 >= messages.length ||
    index2 >= messages.length
  ) {
    return false;
  }

  const msg1 = messages[index1];
  const msg2 = messages[index2];

  // Different sender = different group
  if (msg1.sender !== msg2.sender) return false;

  // More than 5 minutes = different group
  const timeDiff = Math.abs(msg2.timestamp - msg1.timestamp);
  const FIVE_MINUTES = 5 * 60 * 1000;
  if (timeDiff > FIVE_MINUTES) return false;

  return true;
};

// Determine which messages should show headers (first in a group)
export const shouldShowHeader = (
  index: number,
  messages: Message[],
): boolean => {
  if (index === 0) return true;
  return !isInSameGroup(index - 1, index, messages);
};

// Determine message position in group for bubble styling
export const getMessagePosition = (
  index: number,
  messages: Message[],
): "single" | "first" | "middle" | "last" => {
  const hasPrevInGroup = isInSameGroup(index - 1, index, messages);
  const hasNextInGroup = isInSameGroup(index, index + 1, messages);

  if (!hasPrevInGroup && !hasNextInGroup) return "single";
  if (!hasPrevInGroup && hasNextInGroup) return "first";
  if (hasPrevInGroup && hasNextInGroup) return "middle";
  return "last"; // hasPrevInGroup && !hasNextInGroup
};
