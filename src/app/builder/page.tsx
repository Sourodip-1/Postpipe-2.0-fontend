'use client';

import { useState, useEffect } from 'react';
import { createFormAction, getConnectorsAction } from '../actions/builder';
import Link from 'next/link';

interface FormField {
    name: string;
    type: string;
    required: boolean;
}

export default function BuilderPage() {
    const [connectors, setConnectors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [connectorId, setConnectorId] = useState('');
    const [fields, setFields] = useState<FormField[]>([
        { name: 'email', type: 'email', required: true }
    ]);

    const [result, setResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getConnectorsAction().then(data => {
            setConnectors(data);
            if (data.length > 0) setConnectorId(data[0].id);
            setLoading(false);
        });
    }, []);

    const addField = () => {
        setFields([...fields, { name: '', type: 'text', required: false }]);
    };

    const updateField = (index: number, key: keyof FormField, value: any) => {
        const newFields = [...fields];
        // @ts-ignore
        newFields[index][key] = value;
        setFields(newFields);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name || !connectorId) return;
        setSaving(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('connectorId', connectorId);
        formData.append('fields', JSON.stringify(fields));

        const res = await createFormAction(formData);
        setResult(res);
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-neutral-500">Loading connectors...</div>;

    if (connectors.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <h2 className="text-xl font-bold text-white">No Connectors Found</h2>
                    <p className="text-neutral-400">You need to register your local connector first.</p>
                    <Link href="/register" className="inline-block px-6 py-2 bg-emerald-600 text-white rounded font-bold">Register Connector</Link>
                </div>
            </div>
        );
    }

    // Success View - Show HTML Code
    if (result?.success) {
        const connector = connectors.find(c => c.id === connectorId);
        const connectorUrl = connector?.url || 'http://localhost:3002';
        const endpoint = `http://localhost:9002/api/public/submit/${result.formId}`;
        const hasImageFields = fields.some(f => f.type === 'image');

        const imageScript = hasImageFields ? `
  <script>
    document.getElementById('pp-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('pp-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Uploading...';

      var formData = {};
      var inputs = this.querySelectorAll('input, textarea, select');
      var uploadErrors = [];

      var uploads = Array.from(inputs).map(async function(input) {
        if (!input.name) return;
        if (input.type === 'file' && input.files && input.files[0]) {
          try {
            var fileInfo = input.files[0];
            var compressed = fileInfo;
            if (fileInfo.type.startsWith('image/')) {
              compressed = await new Promise(function(resolve) {
                var reader = new FileReader();
                reader.onload = function(e) {
                  var img = new Image();
                  img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var w = img.width, h = img.height, max = 1000;
                    if (w > max) { h = Math.round((h * max) / w); w = max; }
                    canvas.width = w; canvas.height = h;
                    var ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(fileInfo);
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(function(b) {
                      if (b) resolve(new File([b], fileInfo.name, {type: 'image/jpeg'}));
                      else resolve(fileInfo);
                    }, 'image/jpeg', 0.8);
                  };
                  img.onerror = function() { resolve(fileInfo); };
                  img.src = e.target.result;
                };
                reader.onerror = function() { resolve(fileInfo); };
                reader.readAsDataURL(fileInfo);
              });
            }
            var fd = new FormData();
            fd.append('file', compressed);
            var res = await fetch('${connectorUrl}/postpipe/upload', { method: 'POST', body: fd });
            var data = await res.json();
            if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
            formData[input.name] = data.url;
          } catch(err) {
            uploadErrors.push(input.name + ': ' + err.message);
          }
        } else if (input.type !== 'submit') {
          formData[input.name] = input.value;
        }
      });

      await Promise.all(uploads);

      if (uploadErrors.length > 0) {
        alert('Upload failed:\\n' + uploadErrors.join('\\n'));
        btn.disabled = false;
        btn.textContent = 'Submit';
        return;
      }

      btn.textContent = 'Submitting...';
      try {
        var res = await fetch('${endpoint}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          btn.textContent = 'Submitted!';
          document.getElementById('pp-form').reset();
          document.querySelectorAll('.pp-img-preview').forEach(function(el) { el.src = ''; el.style.display = 'none'; });
        } else {
          var err = await res.json();
          alert('Submission failed: ' + (err.error || res.statusText));
          btn.disabled = false;
          btn.textContent = 'Submit';
        }
      } catch(err) {
        alert('Network error: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Submit';
      }
    });

    document.querySelectorAll('input[type="file"]').forEach(function(input) {
      input.addEventListener('change', function() {
        var preview = document.getElementById('preview-' + input.name);
        if (preview && input.files && input.files[0]) {
          preview.src = URL.createObjectURL(input.files[0]);
          preview.style.display = 'block';
        }
      });
    });
  </script>` : '';

        const renderField = (f: FormField) => {
            if (f.type === 'image') {
                return `  <div class="form-group">
    <label>${f.name}${f.required ? ' *' : ''}</label>
    <input type="file" name="${f.name}" accept="image/*" ${f.required ? 'required' : ''} />
    <img id="preview-${f.name}" class="pp-img-preview" style="display:none;max-width:200px;margin-top:8px;border-radius:6px;" alt="preview" />
  </div>`;
            }
            return `  <div class="form-group">
    <label>${f.name}${f.required ? ' *' : ''}</label>
    <input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} />
  </div>`;
        };

        const formTag = hasImageFields
            ? `<form id="pp-form">`
            : `<form id="pp-form" action="${endpoint}" method="POST">`;

        const htmlCode = `${formTag}
${fields.map(renderField).join('\n')}
  <button type="submit" id="pp-submit-btn">Submit</button>
</form>${imageScript}`;

        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-sans flex items-center justify-center">
                <div className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-6 shadow-2xl">
                    <div className="flex items-center gap-3 text-emerald-400 border-b border-neutral-800 pb-4">
                        <span className="text-2xl">🚀</span>
                        <h3 className="text-xl font-bold">Form Created!</h3>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-neutral-400">
                            Copy this HTML snippet and paste it into any website (or a local <code>index.html</code> file).
                            {hasImageFields && (
                                <span className="ml-1 text-amber-400">
                                    {' '}⚠️ Image fields require your connector to have <code className="bg-neutral-800 px-1 rounded">CLOUDINARY_URL</code> set.
                                </span>
                            )}
                        </p>

                        <div className="relative group">
                            <div className="absolute top-2 right-2 text-xs bg-black/50 px-2 py-1 rounded text-neutral-500">HTML</div>
                            <pre className="bg-black/50 p-6 rounded text-sm text-blue-300 font-mono overflow-auto max-h-96">
                                {htmlCode}
                            </pre>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/dashboard" className="flex-1 text-center px-6 py-3 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors">
                            Go to Dashboard
                        </Link>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 border border-neutral-700 hover:bg-neutral-800 rounded font-medium transition-colors">
                            Build Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Builder View
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Form Builder</h1>
                        <p className="text-neutral-400">Design your form and get the integration code.</p>
                    </div>
                </header>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-8">

                    {/* Metadata */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Form Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. User Feedback"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-300 focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Link to Connector</label>
                            <select
                                value={connectorId}
                                onChange={(e) => setConnectorId(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-300 focus:border-emerald-500 outline-none"
                            >
                                {connectors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.url})</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Fields Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium text-white">Form Fields</label>
                            <button onClick={addField} className="text-xs bg-emerald-600/10 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-600/20 transition-colors border border-emerald-600/20">
                                + Add Field
                            </button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, i) => (
                                <div key={i} className="flex gap-3 items-center group">
                                    <input
                                        value={field.name}
                                        onChange={(e) => updateField(i, 'name', e.target.value)}
                                        placeholder="Field Name (e.g. email)"
                                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-neutral-300 focus:border-emerald-500 outline-none"
                                    />
                                    <select
                                        value={field.type}
                                        onChange={(e) => updateField(i, 'type', e.target.value)}
                                        className="w-36 bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-neutral-300 focus:border-emerald-500 outline-none"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="tel">Phone</option>
                                        <option value="image">📷 Image</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => updateField(i, 'required', e.target.checked)}
                                            className="accent-emerald-500"
                                        />
                                        Req
                                    </label>
                                    <button onClick={() => removeField(i)} className="p-2 text-neutral-600 hover:text-red-400 transition-colors">
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>

                        {fields.some(f => f.type === 'image') && (
                            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                                📷 <strong>Image fields</strong> require your connector to be running with{' '}
                                <code className="bg-black/30 px-1 rounded">CLOUDINARY_URL</code> set in its{' '}
                                <code className="bg-black/30 px-1 rounded">.env</code> file.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-neutral-800 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !name}
                            className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Creating...' : 'Create Form & Get Code'}
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
