   // Initialize Firebase
  const config = {
    apiKey: "AIzaSyDM-JDWgFpUKgPvvAUSV3jXNQAuwjivUbw",
    authDomain: "restaurante-a8ee2.firebaseapp.com",
    databaseURL: "https://restaurante-a8ee2.firebaseio.com",
    projectId: "restaurante-a8ee2",
    storageBucket: "restaurante-a8ee2.appspot.com",
    messagingSenderId: "115372339165"
  };
  firebase.initializeApp(config);

  // Refrerencias hacia la base de datos
  const databaseUsuarios = firebase.database().ref('users');
  const databaseChat = firebase.database().ref('chat');
  const databaseConexion = firebase.database().ref('conexion');

  /*Agregando los elementos del DOM para chat*/
  const mensaje = document.getElementById('mensaje');
  const enviar = document.getElementById('enviar');
  const contenedor = document.getElementById('contenedorMensajes');
  const textSesion = document.getElementById("textoSesion");  
  const nameInput = document.getElementById("name");
  const listUsers = document.getElementById("listaUsuarios");
  
  const admon = "Administrador Mamma Mia";
  const anonimo ="Anónimo";
  const cadena = '';
  var usuarioConectado = '';


  var user = firebase.auth().currentUser;

  firebase.auth().onAuthStateChanged(user => {
    let nameUser;
    if(user){
      if(user.displayName!= null){
        nameUser = user.displayName;
      }
      else{
        nameUser = user.email;
      }
      nameInput.value = nameUser;      
      textSesion.innerText = "Cerrar sesión de Google";
      textSesion.setAttribute('href', 'javascript:cerrarSesion(this)');
    }
    else{
      nameInput.value = "Anónimo";      
      textSesion.innerText = "Iniciar sesión con Google";
      textSesion.setAttribute('href', 'javascript:iniciarSesion(this)');
    }
  });

  function iniciarSesion() {
    const provider = new firebase.auth.GoogleAuthProvider(); 
    firebase.auth().signInWithPopup(provider).then((result) =>{
      var token = result.credential.accessToken;
      var user = result.user;
      let userName = result.user.displayName;
      let email = result.user.email;
      var photo = result.user.photoURL;
      // The Google credential, this contain the Google access token:
      let credential = result.credential;

      /*Guarda el nombre del usuario conectado*/ 
      usuarioConectado = userName;
      
      /*Guardar Usuario*/
      firebase.database().ref('users/' +  usuarioConectado).update({
        username: userName,
        email: email,
        foto: photo
      });   
      /*verificar usuarios en linea */
      firebase.database().ref('conexion/'+ usuarioConectado).update({
        username: userName,
        status: 'conectado'
      });   
    }).catch(error => console.error(`Error : ${error.code}: ${error.message}`));

    if(usuarioConectado != admon){
      vistaCliente();
    }else if(usuarioConectado == admon){
      vistaAdmon();
    }
  } 

 function cerrarSesion() {
    firebase.auth().signOut()
      .then(() =>{
        console.log('te has deslogeado')
        nameInput.value = '';
      }).catch(error => console.error(`Error : ${error.code}: ${error.message}`));

    /*verificar usuarios en linea */
    firebase.database().ref('conexion/'+ usuarioConectado).update({
      name: usuarioConectado,
      status: 'desconectado'
    });          

    borrarMensajes();
  }

  //Anonimus function timeStamp, par aagregar fecha y hora al comentario
  const timeStamp = () => {
  let options = {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute:'2-digit'
  };
  let now = new Date().toLocaleString('es-MX', options);
  return now;
}

/*Mostrar usuarios en la vista del chat Administrador*/
databaseConexion.on('value', function (snapshot) {
  let html = '';
  snapshot.forEach(function(e) {
    let elemento = e.val();
    let nombre = elemento.name;
    let estado = elemento.status;  
    if(estado == "conectado"){
      html += `
      <tr>
        <td>
          <input type="checkbox" name="checkbox" id="${nombre}" value="${nombre}"><label for="${nombre}">${nombre}</label>
        </td>
        <td>
          <i class="material-icons light-green-text accent-3-text">check_circle</i>
        </td>
      </tr> `;
    }else{
      html += `
      <tr>
        <td>
          <input type="checkbox" id="usuario" disabled="disabled"><label for="usuario">${nombre}</label>
        </td>
        <td>
          <i class="material-icons grey-text darken-3-text">cancel</i>
        </td>
      </tr> `;
    }
  });
  listUsers.innerHTML = html;
});

/*Evento para enviar y guardar mensajes */
function guardarMensaje(){

  /*Recupera el mensaje ingresado */
  var mensajeEnviado = mensaje.value;
  var usuarioConectado = nameInput.value;
  
  /*Envia los datos a la BD*/
  if( usuarioConectado != admon){
    firebase.database().ref('chat/' + usuarioConectado).push({
      name : usuarioConectado,
      message: mensajeEnviado,
      time: timeStamp()
    });
    mensaje.value = "";
    vistaCliente();
  }
  else{
    /*Usuario seleccionado*/
    var cliente = document.getElementsByName("checkbox");
    for (var x=0; x < cliente.length; x++) {	
      if (cliente[x].checked) {
        usuarioConectado = cliente[x].id;
      }
    }
    /*Envia los datos a la BD*/
    firebase.database().ref('chat/' + usuarioConectado).push({
      name : admon,
      message: mensajeEnviado,
      time: timeStamp()
    });  
    mensaje.value = "";
    vistaAdmon();
  }
}

 /*Mostrar los mensajes enviador en el contenedor */
/*Cliente */
function vistaCliente(){
  firebase.database().ref('chat/' +  nameInput.value).on('value', function(snapshot){
    var html ='';
    snapshot.forEach(function(e) {
      var elemento = e.val();
      var usuario = elemento.name;
      var mensajeEnviado = elemento.message;
      var fecha = elemento.time;
        html += `<hr>
       <h5 id="nombreUsuario">${usuario} </h5>
       <p id="mensajes"> ${mensajeEnviado}</p>
       <span id="fecha">${fecha}</span>`;
    });
    
    contenedor.innerHTML = html;
    /*Posicionar el scroll*/ 
    contenedor.scrollTop =contenedor.scrollHeight;
  });
}

/*Administrador */
function vistaAdmon() {
  /*Usuario seleccionado*/
    var cliente = document.getElementsByName("checkbox");
    for (var x=0; x < cliente.length; x++) {	
      if (cliente[x].checked) {
        usuarioConectado = cliente[x].id;
      }
    }
    firebase.database().ref('chat/' +  usuarioConectado).on('value', function(snapshot){
    var html ='';
    snapshot.forEach(function(e) {
      var elemento = e.val();
      var usuario = elemento.name;
      var mensajeEnviado = elemento.message;
      var fecha = elemento.time;

        html += `<hr>
       <h5 id="nombreUsuario">${usuario} </h5>
       <p id="mensajes"> ${mensajeEnviado}</p>
       <span id="fecha">${fecha}</span>`;
    });
    contenedor.innerHTML = html;
    /*Posicionar el scroll*/ 
    contenedor.scrollTop =contenedor.scrollHeight;
  });
}

/*Borrar los mensajes al cerrar sesión*/
 function borrarMensajes(){
    var html ='';
    html += `<hr>
      <h5 id="nombreUsuario"></h5>
      <p id="mensajes"></p>
      <span id="fecha"></span>`;
    contenedor.innerHTML = html;
 }