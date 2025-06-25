const API_BASE = "http://localhost:8000/api";

document.addEventListener("DOMContentLoaded", () => {
  cargarStockGeneral();
  document.getElementById("btn-buscar").addEventListener("click", buscarProducto);
  document.getElementById("cantidad").addEventListener("input", calcularTotales);
  document.getElementById("sucursal-select").addEventListener("change", calcularTotales);
  document.getElementById("venta-form").addEventListener("submit", enviarVenta);
});

function cargarStockGeneral() {
  fetch(`${API_BASE}/stock-general`)
    .then(res => res.json())
    .then(data => renderTabla(data))
    .catch(err => console.error("Error cargando stock general:", err));
}

function renderTabla(data) {
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
  document.getElementById("panel-venta").classList.remove("d-none");
  document.getElementById("respuesta").innerHTML = "";
  document.getElementById("codigo-producto").value = data.Producto.Codigo;

  const select = document.getElementById("sucursal-select");
  select.innerHTML = "";
  stockActual = data.StockPorSucursal;

  stockActual.forEach((s, i) => {
    const label = `${s.Sucursal} (Stock: ${s.Cantidad})`;
    const option = `<option value="${i}">${label}</option>`;
    select.innerHTML += option;
  });

  // ✅ Mostrar modal SOLO si alguna sucursal no tiene stock
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

  calcularTotales();
}


function calcularTotales() {
  const i = parseInt(document.getElementById("sucursal-select").value);
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const stock = stockActual[i];

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

  const totalCLP = cantidad * stock.Precio;
  document.getElementById("total-clp").innerText = `$${totalCLP.toLocaleString("es-CL")}`;

  // Obtener tipo de cambio y calcular USD
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

  const i = parseInt(document.getElementById("sucursal-select").value);
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const stock = stockActual[i];

  if (cantidad > stock.Cantidad) {
    document.getElementById("respuesta").innerHTML =
      `<div class="alert alert-danger">❌ No hay suficiente stock disponible para esta venta.</div>`;
    return;
  }

  const payload = {
    codigo_producto: document.getElementById("codigo-producto").value,
    id_sucursal: stock.SucursalId || i + 1, // si tienes ID real, úsalo
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

      let msg = `
        <div class="alert alert-success">
          ✅ Venta realizada: ${data.cantidad_vendida} unidad(es)<br>
          Stock restante: ${data.stock_restante}<br>
          Total CLP: <strong>$${data.total_clp.toLocaleString("es-CL")}</strong><br>
          Total USD: <strong>$${data.total_usd.toLocaleString("en-US")}</strong>
        </div>`;

      if (data.stock_agotado) {
        msg += `<div class="alert alert-warning">⚠️ Stock agotado en esta sucursal.</div>`;
      }

      mostrarModalVenta(data);
      cargarStockGeneral(); // actualizar tabla principal
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

// Escuchar alertas del backend vía SSE
const eventSource = new EventSource(`${API_BASE}/sse`);

eventSource.onmessage = function (event) {
  const msg = event.data;

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

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("modalSSE"));
  modal.show();
};


