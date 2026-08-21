import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LABELS = {
  name: 'Name',
  relation: 'Relation',
  age: 'Age',
  phone: 'Phone',
  type: 'Type',
  number: 'Number plate',
  model: 'Model',
  notes: 'Notes'
};

function Field({ k, kind, value, onChange, required }) {
  if (kind === 'vehicles' && k === 'type') {
    return (
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        <option value="two-wheeler">Two-wheeler</option>
        <option value="four-wheeler">Four-wheeler</option>
      </select>
    );
  }
  return (
    <input
      type={k === 'age' ? 'number' : k === 'phone' ? 'tel' : 'text'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={LABELS[k]}
      required={required}
    />
  );
}

function FieldList({ title, addLabel, items, keys, onChange, empty, kind }) {
  function add() {
    const blank = {};
    keys.forEach((k) => (blank[k] = ''));
    onChange([...(items || []), blank]);
  }
  function set(i, k, v) {
    onChange(items.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <section className="flat-sec">
      <div className="flat-sec-h">
        <span>{title}</span>
        <button
          type="button"
          className="flat-add"
          onClick={add}
          aria-label={addLabel}
          title={addLabel}
        >
          +
        </button>
      </div>
      {(items || []).length === 0 ? (
        <p className="flat-empty">{empty}</p>
      ) : (
        <div className="flat-list">
          {(items || []).map((row, i) => (
            <div key={i} className={'flat-row cols-' + keys.length}>
              {keys.map((k) => (
                <label key={k} className={k === 'age' ? 'is-age' : undefined}>
                  {LABELS[k]}
                  <Field k={k} kind={kind} value={row[k]} onChange={(v) => set(i, k, v)} />
                </label>
              ))}
              <button
                type="button"
                className="flat-x"
                onClick={() => remove(i)}
                aria-label="Remove"
                title="Remove"
              >
                −
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MyFlat() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [residentType, setResidentType] = useState(user.residentType || 'owner');
  const [familyMembers, setFamily] = useState(user.familyMembers || []);
  const [vehicles, setVehicles] = useState(user.vehicles || []);
  const [pets, setPets] = useState(user.pets || []);
  const [emergencyContacts, setEm] = useState(user.emergencyContacts || []);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setSaving(true);
    try {
      const cleanFamily = familyMembers.map((m) => ({
        ...m,
        age: m.age === '' || m.age == null ? undefined : Number(m.age)
      }));
      const updated = await api('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          residentType,
          familyMembers: cleanFamily,
          vehicles,
          pets,
          emergencyContacts
        })
      });
      setUser(updated);
      setMsg('Flat details saved');
    } catch (ex) {
      setErr(ex.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flat-page" onSubmit={save}>
      <div className="list-head">
        <h3>My flat</h3>
      </div>
      <div className="card flat-card">
        <div className="flat-body">
          <div className="flat-top">
            <h3>
              {user.block}-{user.flatNo}
            </h3>
            <p className="flat-meta">{user.email}</p>
          </div>

          <section className="flat-sec">
            <div className="flat-sec-h">
              <span>You</span>
            </div>
            <div className="flat-row cols-you">
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Lives as
                <select value={residentType} onChange={(e) => setResidentType(e.target.value)}>
                  <option value="owner">Owner</option>
                  <option value="tenant">Tenant</option>
                </select>
              </label>
              <label>
                Phone
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>
          </section>

          <FieldList
            title="Family members"
            addLabel="Add member"
            empty="No one else listed."
            items={familyMembers}
            keys={['name', 'relation', 'age', 'phone']}
            onChange={setFamily}
          />
          <FieldList
            title="Vehicles"
            addLabel="Add vehicle"
            empty="No vehicles yet."
            kind="vehicles"
            items={vehicles}
            keys={['type', 'number', 'model']}
            onChange={setVehicles}
          />
          <FieldList
            title="Pets"
            addLabel="Add pet"
            empty="No pets yet."
            items={pets}
            keys={['name', 'type', 'notes']}
            onChange={setPets}
          />
          <FieldList
            title="Emergency contacts"
            addLabel="Add contact"
            empty="Add someone we can reach."
            items={emergencyContacts}
            keys={['name', 'relation', 'phone']}
            onChange={setEm}
          />
        </div>
        <div className="flat-save">
          <div className="flat-save-msg">
            {msg && <div className="okmsg">{msg}</div>}
            {err && <div className="err">{err}</div>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save my flat'}
          </button>
        </div>
      </div>
    </form>
  );
}
