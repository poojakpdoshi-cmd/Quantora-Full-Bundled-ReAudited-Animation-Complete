import React, { useState } from 'react';
import type { GeneratedProject } from './types';

interface WhatsAppCommerceProps {
  activeProject: GeneratedProject | null;
}

export function WhatsAppCommerceEngine({ activeProject }: WhatsAppCommerceProps) {
  const [merchantPhone, setMerchantPhone] = useState('+91 98765 00000');
  const [currency, setCurrency] = useState('₹');
  const [products, setProducts] = useState([
    { id: '1', name: 'Signature Espresso Blend (500g)', price: '650', stock: 'In Stock' },
    { id: '2', name: 'Cold Brew Artisan Concentrate', price: '450', stock: 'In Stock' },
    { id: '3', name: 'Handcrafted Ceramic Mug', price: '850', stock: 'Low Stock' }
  ]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [saved, setSaved] = useState(false);

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice.trim()) return;
    setProducts([
      ...products,
      {
        id: String(Date.now()),
        name: newProductName.trim(),
        price: newProductPrice.trim(),
        stock: 'In Stock'
      }
    ]);
    setNewProductName('');
    setNewProductPrice('');
  }

  function removeProduct(id: string) {
    setProducts(products.filter(p => p.id !== id));
  }

  function testOrder(product: { name: string; price: string }) {
    const cleanNum = merchantPhone.replace(/[^0-9]/g, '');
    const text = `Hello! I would like to enquire about ordering from your website:\n\n📦 *Item:* ${product.name}\n💰 *Listed price:* ${currency}${product.price}\n📍 *Delivery Address:* [Customer Address]\n\nPlease confirm availability, delivery details, and next steps. No online payment is collected in this flow.`;
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="feature-studio-container whatsapp-commerce-studio">
      <div className="feature-header">
        <span className="feature-badge">🛍️ 1-TAP WHATSAPP COMMERCE</span>
        <h2>Payment-Free WhatsApp Order Enquiries</h2>
        <p className="feature-subtitle">
          Let customers send a pre-filled order enquiry through WhatsApp. Quantora does not collect online payments or payment details.
        </p>
      </div>

      <div className="commerce-grid">
        <div className="commerce-config-card">
          <h3>Store & Merchant Settings</h3>

          <label className="input-group">
            <span>Merchant WhatsApp Number (Where orders arrive)</span>
            <input
              type="text"
              value={merchantPhone}
              onChange={(e) => setMerchantPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </label>

          <label className="input-group">
            <span>Displayed currency symbol (information only)</span>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ width: '80px', textAlign: 'center' }}
            />
          </label>

          <p className="feature-note">Orders are handled manually through WhatsApp. This feature has no online checkout, payment form, or payment prompt.</p>

          <button
            type="button"
            className="nx-button nx-button--primary"
            onClick={handleSave}
            style={{ marginTop: '16px' }}
          >
            {saved ? '✓ Commerce Configuration Activated!' : '💾 Activate on Active Website'}
          </button>
        </div>

        <div className="commerce-catalog-card">
          <h3>Live Product Catalog & Test</h3>

          <form onSubmit={addProduct} className="add-product-form">
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Product or Service Name"
              required
            />
            <input
              type="text"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              placeholder="Price"
              style={{ width: '90px' }}
              required
            />
            <button type="submit" className="nx-button nx-button--compact">
              + Add Item
            </button>
          </form>

          <div className="product-list">
            {products.map((p) => (
              <div key={p.id} className="product-item-card">
                <div className="product-info">
                  <strong>{p.name}</strong>
                  <span className="product-price">{currency}{p.price}</span>
                  <span className="stock-tag">{p.stock}</span>
                </div>
                <div className="product-actions">
                  <button
                    type="button"
                    className="test-wa-order-btn"
                    onClick={() => testOrder(p)}
                    title="Test payment-free WhatsApp enquiry flow"
                  >
                    💬 Test WhatsApp Enquiry
                  </button>
                  <button
                    type="button"
                    className="delete-item-btn"
                    onClick={() => removeProduct(p.id)}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
