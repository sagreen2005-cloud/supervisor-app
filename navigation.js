function showPage(page){

switch(page){

case "dashboard":

loadDashboard();

break;

case "employees":

loadEmployeesPage();

break;

default:

document.getElementById("content").innerHTML=
"<h2>Coming Soon</h2>";

}

}
