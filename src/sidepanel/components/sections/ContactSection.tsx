import type { ReactElement } from 'react';

import type { Contact } from '../../../lib/resume';
import { LinksField } from '../LinksField';
import { TextField } from '../ui/TextField';

interface ContactSectionProps {
  contact: Contact;
  onChange: (contact: Contact) => void;
}

export function ContactSection({
  contact,
  onChange,
}: ContactSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink-900">Contact</h2>
      <div className="flex gap-3">
        <TextField
          label="Full name"
          required
          value={contact.fullName}
          onChange={(fullName) => {
            onChange({ ...contact, fullName });
          }}
        />
        <TextField
          label="Email"
          type="email"
          required
          value={contact.email}
          onChange={(email) => {
            onChange({ ...contact, email });
          }}
        />
      </div>
      <div className="flex gap-3">
        <TextField
          label="Phone"
          type="tel"
          value={contact.phone ?? ''}
          onChange={(phone) => {
            onChange({ ...contact, phone: phone || undefined });
          }}
        />
        <TextField
          label="Location"
          value={contact.location ?? ''}
          onChange={(location) => {
            onChange({ ...contact, location: location || undefined });
          }}
        />
      </div>
      <LinksField
        links={contact.links}
        onChange={(links) => {
          onChange({ ...contact, links });
        }}
      />
    </section>
  );
}
