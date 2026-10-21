/**
 * Extracts initials from a full name string.
 * Example: "Kelvin Yeboah" -> "KY"
 * * @param {string} name - The full name of the user
 * @returns {string} The capitalized initials
 */
export const getInitials = (name) => {
  if (!name) return "";
  
  // Trim spaces and split the name by spaces into an array
  const nameParts = name.trim().split(" ");
  
  // If there's a first and last name, grab the first letter of both
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  
  // Fallback: If only one name is provided, just return its first letter
  return nameParts[0][0].toUpperCase();
};