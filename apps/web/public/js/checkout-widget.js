/**
 * SAABIZ Checkout Widget
 * Embed this script on your website to enable product purchases
 * 
 * Usage:
 * <script src="https://your-domain.com/js/checkout-widget.js"></script>
 * <div id="saabiz-checkout" data-product="product-id" data-plan="plan-id"></div>
 */
(function() {
  'use strict';

  const scriptTag = typeof document !== 'undefined' ? document.currentScript : null;
  const scriptUrl = scriptTag && scriptTag.src ? new URL(scriptTag.src) : null;
  const SCRIPT_ORIGIN = scriptUrl ? scriptUrl.origin : null;
  const SCRIPT_API_URL = scriptTag && scriptTag.dataset.apiUrl ? scriptTag.dataset.apiUrl : null;

  const SAABIZ_API_URL = SCRIPT_API_URL || (SCRIPT_ORIGIN ? `${SCRIPT_ORIGIN}/api` : 'http://localhost:3001/api');
  const SAABIZ_WEB_URL = SCRIPT_ORIGIN || 'http://localhost:3000';

  class SaabizCheckoutWidget {
    constructor(element, options) {
      this.element = element;
      this.productId = element.dataset.product;
      this.planId = element.dataset.plan;
      this.apiUrl = options.apiUrl || SAABIZ_API_URL;
      this.webUrl = options.webUrl || SAABIZ_WEB_URL;
      this.theme = options.theme || {};
      
      this.init();
    }

    async init() {
      try {
        const response = await fetch(`${this.apiUrl}/checkout/embed/${this.productId}/${this.planId}`);
        const data = await response.json();
        
        if (data.error) {
          this.renderError(data.error);
          return;
        }

        this.render(data);
      } catch (error) {
        this.renderError('Failed to load checkout. Please try again.');
      }
    }

    render(data) {
      const product = data.product;
      const plan = data.plan;

      this.element.innerHTML = `
        <div class="saabiz-checkout-widget" style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 400px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">
          <div style="
            background: linear-gradient(135deg, ${this.theme.primary || '#4f46e5'}, ${this.theme.secondary || '#7c3aed'});
            padding: 24px;
            color: white;
          ">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${product.name}</h3>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">${product.description || ''}</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            ">
              <span style="color: #6b7280; font-size: 14px;">${plan.name}</span>
              <span style="font-size: 24px; font-weight: 700; color: #111827;">
                $${plan.price}
                <span style="font-size: 14px; font-weight: 400; color: #6b7280;">
                  /${plan.interval?.toLowerCase() || 'month'}
                </span>
              </span>
            </div>
            
            ${plan.features ? `
              <ul style="
                list-style: none;
                padding: 0;
                margin: 0 0 20px 0;
              ">
                ${plan.features.split(',').map(f => `
                  <li style="
                    display: flex;
                    align-items: center;
                    padding: 8px 0;
                    color: #374151;
                    font-size: 14px;
                  ">
                    <span style="
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #10b981;
                      color: white;
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      margin-right: 10px;
                      font-size: 12px;
                    ">✓</span>
                    ${f.trim()}
                  </li>
                `).join('')}
              </ul>
            ` : ''}
            
            <button class="saabiz-buy-btn" style="
              width: 100%;
              padding: 14px 24px;
              background: ${this.theme.primary || '#4f46e5'};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">
              Buy Now
            </button>
            
            <p style="
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
              margin-top: 16px;
            ">
              Secure payment powered by SAABIZ
            </p>
          </div>
        </div>
      `;

      const button = this.element.querySelector('.saabiz-buy-btn');
      button.addEventListener('click', () => {
        window.location.href = `${this.webUrl}/checkout?productId=${this.productId}&planId=${this.planId}`;
      });
    }

    renderError(message) {
      this.element.innerHTML = `
        <div style="
          padding: 20px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          text-align: center;
        ">
          ${message}
        </div>
      `;
    }
  }

  window.SaabizCheckoutWidget = SaabizCheckoutWidget;

  document.addEventListener('DOMContentLoaded', function() {
    const widgets = document.querySelectorAll('[data-product][data-plan]');
    widgets.forEach(function(el) {
      new SaabizCheckoutWidget(el, {});
    });
  });

})();
