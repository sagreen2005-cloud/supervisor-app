/* Roll Call module */
.roll-call-form-header,
.roll-call-filter-header,
.roll-call-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.roll-call-close {
  width: 34px;
  min-width: 34px;
  height: 34px;
  padding: 0;
  font-size: 22px;
}

.roll-call-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
}

.roll-call-checkbox input {
  width: auto;
}

.roll-call-form-actions,
.roll-call-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.roll-call-form-actions {
  margin-top: 10px;
}

.roll-call-form-actions button,
.roll-call-card-actions button {
  width: auto;
  min-width: 0;
}

.roll-call-section {
  margin-top: 18px;
}

.roll-call-items {
  display: grid;
  gap: 10px;
}

.roll-call-card {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 13px;
}

.roll-call-card:hover {
  border-color: var(--accent);
}

.roll-call-pinned {
  border-color: var(--accent);
}

.roll-call-expired {
  opacity: 0.7;
}

.roll-call-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 7px;
}

.roll-call-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 10px;
  color: var(--text-muted);
}

.roll-call-badge.pinned {
  border-color: var(--accent);
  color: var(--accent);
}

.roll-call-badge.priority-high,
.roll-call-badge.priority-critical,
.roll-call-badge.expired {
  font-weight: 700;
}

.roll-call-badge.priority-critical {
  color: #ef4444;
}

.roll-call-badge.priority-high {
  color: #f59e0b;
}

.roll-call-message {
  white-space: pre-wrap;
  margin: 10px 0;
}

.roll-call-expiration {
  margin-bottom: 0;
}

.roll-call-empty {
  padding: 16px 0;
}

.roll-call-copy-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.65);
  padding: 24px;
}

.roll-call-copy-content {
  width: min(760px, 100%);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.roll-call-copy-content textarea {
  min-height: 420px;
}

@media (max-width: 760px) {
  .roll-call-card-header,
  .roll-call-form-header {
    display: block;
  }

  .roll-call-card-actions {
    margin-top: 10px;
  }
}
