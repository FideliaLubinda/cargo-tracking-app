// Example: get luggageId from query string or prompt
const luggageId = prompt('Enter Luggage ID to view logs:');
fetch(`/api/custody/by-luggage/${luggageId}`)
  .then(res => res.json())
  .then(logs => {
    const div = document.getElementById('logs');
    if (!logs.length) return div.innerText = 'No logs found.';
    div.innerHTML = logs.map(log =>
      `<div>
        <b>Handler:</b> ${log.handlerName} (${log.company}, ${log.employeeId})<br>
        <b>Time:</b> ${log.timestamp}
      </div><hr>`
    ).join('');
  });