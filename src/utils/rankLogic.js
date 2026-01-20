// src/utils/rankLogic.js
export const getNurseRank = (score) => {
  if (score >= 301) return { title: "Top Notcher", color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-300" };
  if (score >= 151) return { title: "Nurse Supervisor", color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-300" };
  if (score >= 51) return { title: "Registered Nurse (RN)", color: "text-green-600", bg: "bg-green-100", border: "border-green-300" };
  return { title: "Student Nurse", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-300" };
};