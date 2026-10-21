import './dateStyle.css'

const AttendanceDate = ({ selected, onSelect }) => {
    const today = new Date();
    const activeDay = (selected || today).getDate();

    const dates = Array.from(
        {
            length: new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            ).getDate(),
        },
        (_, index) => {
            const date = new Date(
                today.getFullYear(),
                today.getMonth(),
                index + 1
            );

            return {
                day: date.getDate(),
                weekDay: date.toLocaleDateString("en-US", {
                    weekday: "short",
                }),
                date,
            };
        }
    );

    return (
        <div className="date-selector">
            {dates.map((d) => (
                <button
                    key={d.day}
                    type="button"
                    className={activeDay === d.day ? "active" : ""}
                    onClick={() => onSelect?.(d.date)}
                >
                    <h3>{d.day}</h3>
                    <span>{d.weekDay}</span>
                </button>
            ))}
        </div>
    );
}

export default AttendanceDate;
