document.addEventListener('DOMContentLoaded', () => {
  const recoContainer = document.querySelector('[data-reco-container]');
  const productId = recoContainer && recoContainer.getAttribute('data-product-id');
  if (recoContainer && productId) {
    fetch(`/api/recommendations/${productId}`)
      .then(res => res.json())
      .then(data => {
        const items = data.recommended || [];
        if (!items.length) {
          recoContainer.innerHTML = '<p class="text-muted">Sin recomendaciones por ahora.</p>';
          return;
        }
        const html = items.map(p => `
          <div class="col">
            <div class="card h-100">
              <img src="${p.image_url || ''}" class="card-img-top" alt="${p.name}">
              <div class="card-body">
                <h6 class="card-title">${p.name}</h6>
                <p class="card-text text-muted">$${Number(p.price).toFixed(2)}</p>
                <a class="btn btn-sm btn-outline-light" href="/producto/${p.id}">Ver</a>
              </div>
            </div>
          </div>`).join('');
        recoContainer.innerHTML = `<div class="row row-cols-2 row-cols-md-3 g-3">${html}</div>`;
      })
      .catch(() => {
        recoContainer.innerHTML = '<p class="text-muted">No se pudieron cargar recomendaciones.</p>';
      });
  }

  document.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!confirm(btn.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    });
  });
});

