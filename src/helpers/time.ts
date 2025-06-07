export const generateTimeSlots = ({
  startTime = 5,
  endTime = 23,
  intervalMinutes = 30,
}: {
  startTime: number;
  endTime: number;
  intervalMinutes: number;
}) => {
  const slots = [];
  for (let hour = startTime; hour <= endTime; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
      slots.push(timeString);
    }
  }
  return slots;
};

// export const generateTimeSlots = () => {
//   const slots = [];
//   for (let hour = 5; hour <= 23; hour++) {
//     for (let minute = 0; minute < 60; minute += 30) {
//       const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
//       slots.push(timeString);
//     }
//   }
//   return slots;
// };
