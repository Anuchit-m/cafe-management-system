document.addEventListener('DOMContentLoaded', () => {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (!dateTimeElement) return;

    const formatThaiDateTime = (date) => {
        return date.toLocaleString('th-TH', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const updateDateTime = () => {
        dateTimeElement.textContent = formatThaiDateTime(new Date());
    };

    updateDateTime();
    setInterval(updateDateTime, 60000);
});
