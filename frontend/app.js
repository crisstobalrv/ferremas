const API_BASE = "http://localhost:8000/api";

document.addEventListener("DOMContentLoaded", () => {
  cargarStockGeneral();
  document.getElementById("btn-buscar").addEventListener("click", buscarProducto);
  document.getElementById("cantidad").addEventListener("input", calcularTotales);
  document.getElementById("sucursal-select").addEventListener("change", calcularTotales);
  document.getElementById("venta-form").addEventListener("submit", enviarVenta);
});

window.addEventListener("DOMContentLoaded", () => {
  cargarStockGeneral();
});


function cargarStockGeneral() {
  fetch(`${API_BASE}/stock-general`)
    .then(res => res.json())
    .then(productos => {
      const tbody = document.getElementById("stock-body");
      tbody.innerHTML = "";

      productos.forEach(producto => {
        // Asegura que haya una ruta relativa válida
        let imagenRelativa = producto.Imagen;

        if (!imagenRelativa || imagenRelativa === "") {
          imagenRelativa = "/static/images/default.jpg"; // puedes crear esta imagen
        } else if (!imagenRelativa.startsWith("/")) {
          imagenRelativa = `/static/images/${imagenRelativa}`;
        }

        const urlImagen = `${window.location.origin}${imagenRelativa}`;

        console.log("🖼️ Imagen URL:", urlImagen); // Verifica en consola

        producto.StockPorSucursal.forEach(stock => {
  const imagenRelativa = producto.Imagen?.startsWith("/") ? producto.Imagen : `/static/images/${producto.Imagen}`;
  const urlImagen = `${window.location.origin}${imagenRelativa}`;

  tbody.innerHTML += `
    <tr>
      <td>${producto.Codigo}</td>
      <td>${producto.Nombre}</td>
      <td>${producto.Marca}</td> <!-- ✅ Aquí -->
      <td>${stock.Sucursal}</td>
      <td>${stock.Cantidad}</td>
      <td>$${stock.Precio.toLocaleString("es-CL")}</td>
      <td><img src="${urlImagen}" width="50" height="50"onerror="this.onerror=null; this.src='https://via.placeholder.com/50'" /></td>
    </tr>
  `;
});

      });
    });
}





function renderTabla(data) {

const idSucursal = parseInt(document.getElementById("sucursal-select").value);
const stock = stockActual.find(s => s.SucursalId === idSucursal);

if (!stock) return;

const precio = stock.Precio || data.Producto?.Precio || 0;


  const tbody = document.getElementById("stock-body");
  tbody.innerHTML = "";
  data.forEach(producto => {
    producto.StockPorSucursal.forEach(stock => {
      const fila = `
        <tr>
          <td>${producto.Nombre} (${producto.Codigo})</td>
          <td>${stock.Sucursal}</td>
          <td>${stock.Cantidad}</td>
          <td>$${stock.Precio.toLocaleString("es-CL")}</td>
        </tr>
      `;
      tbody.innerHTML += fila;
    });
  });
}

function buscarProducto() {
  const valor = document.getElementById("buscador-producto").value.trim();
  if (!valor) return;

  fetch(`${API_BASE}/productos/${valor}/stock`)
    .then(res => {
      if (!res.ok) throw new Error("Producto no encontrado");
      return res.json();
    })
    .then(data => mostrarPanelVenta(data))
    .catch(err => {
  document.getElementById("panel-venta").classList.add("d-none");
  mostrarModalError("Producto no encontrado", `No se encontró ningún producto con ese código o nombre.`);
});

}

let stockActual = []; // se guarda stock por sucursal del producto seleccionado

function mostrarPanelVenta(data) {
  console.log("🧪 Datos recibidos:", data);


  window.productoSeleccionado = data.Producto;

  console.log("✅ mostrarPanelVenta se está ejecutando");

  document.getElementById("panel-venta").classList.remove("d-none");
  document.getElementById("respuesta").innerHTML = "";
  document.getElementById("codigo-producto").value = data.Producto.Codigo;

  const select = document.getElementById("sucursal-select");
  select.innerHTML = "";
  stockActual = data.StockPorSucursal;

  // ✅ Agregar opciones al select
  stockActual.forEach((s) => {
    const label = `${s.Sucursal} (Stock: ${s.Cantidad})`;
    const option = `<option value="${s.SucursalId}">${label}</option>`;
    select.innerHTML += option;
  });

  // ✅ Mostrar modal si alguna sucursal no tiene stock
  const haySinStock = stockActual.some(s => s.Cantidad === 0);
  if (haySinStock) {
    const listaSucursales = stockActual.map(s => {
      if (s.Cantidad === 0) {
        return `<li>❌ ${s.Sucursal}: <strong>Sin stock</strong></li>`;
      } else {
        return `<li>✅ ${s.Sucursal}: ${s.Cantidad} unidad(es) a $${s.Precio.toLocaleString("es-CL")}</li>`;
      }
    }).join("");

    document.getElementById("modalStockAgotadoContenido").innerHTML =
      `<ul>${listaSucursales}</ul>`;

    const modal = new bootstrap.Modal(document.getElementById("modalStockAgotado"));
    modal.show();
  }


  const selectSucursal = document.getElementById("sucursal-select");
  const inputCantidad = document.getElementById("cantidad");

  selectSucursal.removeEventListener("change", calcularTotales);
  inputCantidad.removeEventListener("input", calcularTotales);

  selectSucursal.addEventListener("change", calcularTotales);
  inputCantidad.addEventListener("input", calcularTotales);

  calcularTotales(); // ✅ cálculo inicial
}




function calcularTotales() {
  const idSucursal = parseInt(document.getElementById("sucursal-select").value);
  const cantidad = parseInt(document.getElementById("cantidad").value);

  const stock = stockActual.find(s => s.SucursalId === idSucursal);

  if (!stock || isNaN(cantidad) || cantidad <= 0) {
    document.getElementById("total-clp").innerText = "0";
    document.getElementById("total-usd").innerText = "0";
    return;
  }

  if (cantidad > stock.Cantidad) {
    document.getElementById("respuesta").innerHTML =
      `<div class="alert alert-warning">⚠️ No hay suficiente stock disponible.</div>`;
  } else {
    document.getElementById("respuesta").innerHTML = "";
  }

  // ✅ Usar precio del stock o del producto
  let precioUnitario = 0;

  if (stock.Precio && stock.Precio > 0) {
    precioUnitario = stock.Precio;
  } else if (window.productoSeleccionado?.precio > 0) {
    precioUnitario = window.productoSeleccionado.precio;
  } else {
    precioUnitario = 0;
  }

  const totalCLP = cantidad * precioUnitario;
  document.getElementById("total-clp").innerText = `$${totalCLP.toLocaleString("es-CL")}`;

  fetch(`${API_BASE}/exchange-rate`)
    .then(res => res.json())
    .then(data => {
      const valorDolar = Number(data["Precio del Dolar Actual"].replace(".", "").replace(",", "."));
      const totalUSD = (totalCLP / valorDolar).toFixed(2);
      document.getElementById("total-usd").innerText = `$${totalUSD}`;
    })
    .catch(() => {
      document.getElementById("total-usd").innerText = "Error";
    });
}






function enviarVenta(e) {
  e.preventDefault();

  const idSucursal = parseInt(document.getElementById("sucursal-select").value);
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const codigo = document.getElementById("codigo-producto").value;

  if (isNaN(cantidad) || cantidad <= 0) {
    document.getElementById("respuesta").innerHTML =
      `<div class="alert alert-warning">⚠️ Debes ingresar una cantidad mayor a cero.</div>`;
    return;
  }

  const stock = stockActual.find(s => s.SucursalId === idSucursal);

  if (!stock) {
    document.getElementById("respuesta").innerHTML =
      `<div class="alert alert-danger">❌ Stock no encontrado para esta sucursal.</div>`;
    return;
  }

  if (cantidad > stock.Cantidad) {
    document.getElementById("respuesta").innerHTML =
      `<div class="alert alert-danger">❌ No hay suficiente stock disponible para esta venta.</div>`;
    return;
  }

  const payload = {
    codigo_producto: codigo,
    id_sucursal: idSucursal,
    cantidad: cantidad
  };

  fetch(`${API_BASE}/venta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.detail) {
        document.getElementById("respuesta").innerHTML =
          `<div class="alert alert-danger">❌ ${data.detail}</div>`;
        return;
      }

      // ✅ Mostrar resultado en modal de venta exitosa
      mostrarModalVenta(data);
      cargarStockGeneral(); // Actualizar tabla principal

      console.log("✅ Venta realizada:", data);
    })
    .catch(err => {
      console.error("Error:", err);
      document.getElementById("respuesta").innerHTML =
        `<div class="alert alert-danger">❌ Error al procesar la venta.</div>`;
    });
}



function mostrarModalError(titulo, mensaje) {
  const modalHtml = `
    <div class="modal fade" id="modalError" tabindex="-1" aria-labelledby="modalErrorLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content border-danger">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title d-flex justify-content-center" id="modalErrorLabel">${titulo}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">${mensaje}</div>
          <div class="modal-footer text-center">
            <button type="button" class="btn btn-secondary " data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("modalError"));
  modal.show();
}

function mostrarModalVenta(data) {

  
  
  let html = `
    <p><strong>Producto:</strong> ${data.producto}</p>
    <p><strong>Sucursal:</strong> ${data.sucursal}</p>
    <p><strong>Cantidad vendida:</strong> ${data.cantidad_vendida}</p>
    <p><strong>Stock restante:</strong> ${data.stock_restante}</p>
    <p><strong>Total CLP:</strong> $${data.total_clp.toLocaleString("es-CL")}</p>
    <p><strong>Total USD:</strong> $${data.total_usd.toLocaleString("en-US")}</p>
  `;

  if (data.stock_agotado) {
    html += `<div class="alert alert-warning mt-2">⚠️ Stock agotado en esta sucursal.</div>`;
  }

  document.getElementById("modalVentaExitosaContenido").innerHTML = html;
  const modal = new bootstrap.Modal(document.getElementById("modalVentaExitosa"));
  modal.show();
}


function mostrarModalSSE(msg) {
  // Eliminar modal anterior si existe
  const existente = document.getElementById("modalSSE");
  if (existente) existente.remove();

  const modalHtml = `
    <div class="modal fade" id="modalSSE" tabindex="-1" aria-labelledby="modalSSELabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content border-warning">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title" id="modalSSELabel">🔔 Alerta de Stock</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">${msg}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("modalSSE"));
  modal.show();
}

let mensajePendienteSSE = null;

const eventSource = new EventSource(`${API_BASE}/sse`);

eventSource.onmessage = function (event) {
  const msg = event.data;
  const modalActivo = document.querySelector(".modal.show");

  if (modalActivo) {
    mensajePendienteSSE = msg; // Guarda mensaje pendiente
  } else {
    mostrarModalSSE(msg); // Muestra inmediatamente
  }
};

document.addEventListener("hidden.bs.modal", function (event) {
  const modalesImportantes = [
    "modalVentaExitosa",
    "modalStockAgotado",
    "modalError"
  ];

  if (modalesImportantes.includes(event.target.id) && mensajePendienteSSE) {
    mostrarModalSSE(mensajePendienteSSE);
    mensajePendienteSSE = null;
  }
});

document.getElementById("form-crear-producto").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("codigo", document.getElementById("nuevo-codigo").value.trim());
  formData.append("nombre", document.getElementById("nuevo-nombre").value.trim());
  formData.append("marca", document.getElementById("nuevo-marca").value.trim());
  formData.append("precio", document.getElementById("nuevo-precio").value.trim());
  formData.append("imagen", document.getElementById("nuevo-imagen").files[0]);

  const respuestaDiv = document.getElementById("crear-producto-respuesta");

  fetch(`${API_BASE}/productos`, {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.detail) {
        respuestaDiv.innerHTML = `<div class="alert alert-danger">❌ ${data.detail}</div>`;
      } else {
        respuestaDiv.innerHTML = `<div class="alert alert-success">✅ Producto creado correctamente.</div>`;
        setTimeout(() => {
          document.getElementById("modalCrearProducto").querySelector(".btn-close").click();
          cargarStockGeneral();
        }, 1000);
      }
    })
    .catch(err => {
      console.error(err);
      respuestaDiv.innerHTML = `<div class="alert alert-danger">❌ Error al crear el producto.</div>`;
    });
});


document.getElementById("modalAgregarStock").addEventListener("show.bs.modal", () => {
  // cargar productos
  fetch(`${API_BASE}/productos`)
    .then(res => res.json())
    .then(productos => {
      const selectProd = document.getElementById("producto-stock");
      selectProd.innerHTML = "";
      console.log("Respuesta de /productos:", productos); // 👈 
      productos.forEach(p => {
        selectProd.innerHTML += `<option value="${p.codigo}">${p.nombre}</option>`;
      });
      
    });

  // cargar sucursales
  fetch(`${API_BASE}/sucursales`)
    .then(res => res.json())
    .then(sucursales => {
      const selectSuc = document.getElementById("sucursal-stock");
      selectSuc.innerHTML = "";
      sucursales.forEach(s => {
        selectSuc.innerHTML += `<option value="${s.id}">${s.nombre}</option>`;
      });
    });
});

document.getElementById("form-agregar-stock").addEventListener("submit", function (e) {
  e.preventDefault();

  const codigo_producto = document.getElementById("producto-stock").value;
  const id_sucursal = parseInt(document.getElementById("sucursal-stock").value);
  const cantidad = parseInt(document.getElementById("cantidad-stock").value);

  const respuesta = document.getElementById("respuesta-agregar-stock");

  if (!codigo_producto || !id_sucursal || isNaN(cantidad) || cantidad <= 0) {
    respuesta.innerHTML = `<div class="alert alert-warning">⚠️ Debes completar todos los campos correctamente.</div>`;
    return;
  }

  fetch(`${API_BASE}/reponer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo_producto, id_sucursal, cantidad })
  })
    .then(res => res.json())
    .then(data => {
      if (data.detail) {
        respuesta.innerHTML = `<div class="alert alert-danger">❌ ${data.detail}</div>`;
      } else {
        respuesta.innerHTML = `<div class="alert alert-success">✅ ${data.mensaje}</div>`;
        setTimeout(() => {
          document.getElementById("modalAgregarStock").querySelector(".btn-close").click();
          cargarStockGeneral();
        }, 1000);
      }
    })
    .catch(err => {
      console.error(err);
      respuesta.innerHTML = `<div class="alert alert-danger">❌ Error al reponer stock.</div>`;
    });
});






