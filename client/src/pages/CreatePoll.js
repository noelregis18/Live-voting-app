import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTrash, FaLightbulb, FaQuestion, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import axios from 'axios';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// API URL for backend
const API_URL = 'http://localhost:5000/api';

// --- Poll Templates ---
const pollTemplates = [
  {
    name: 'Favorite Food',
    icon: '🍕',
    data: {
      title: 'What is your favorite type of food?',
      description: 'I am curious to know what type of cuisine people prefer the most.',
      options: ['Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian'],
    },
  },
  {
    name: 'Travel Destination',
    icon: '✈️',
    data: {
      title: 'Where would you like to go on vacation?',
      description: 'If you could travel anywhere, which destination would you choose?',
      options: ['Beach resort', 'Mountain getaway', 'European tour', 'Asian adventure'],
    },
  },
  {
    name: 'Movie Genre',
    icon: '🎬',
    data: {
      title: 'What movie genre do you prefer?',
      description: 'Help us understand which type of movies are most popular.',
      options: ['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction'],
    },
  },
];

// --- Validation Schema ---
const validationSchema = Yup.object({
  title: Yup.string().required('Title is required').max(100, 'Title too long'),
  description: Yup.string().required('Description is required').max(500, 'Description too long'),
  options: Yup.array()
    .of(Yup.string().required('Option text is required'))
    .min(2, 'At least 2 options are required')
    .test('unique', 'Options must be unique', (opts) => {
      const set = new Set(opts);
      return set.size === opts.length;
    }),
});

// --- Default Initial Values ---
const defaultInitialValues = {
  title: '',
  description: '',
  options: ['', ''],
};

// --- Live Preview Component ---
const PollPreview = ({ title, description, options }) => (
  <div className="card" style={{ marginTop: 24, marginBottom: 24, background: '#f9f9ff', border: '1px solid #eee' }}>
    <div className="card-header" style={{ background: '#f3f0fa' }}>
      <h4 style={{ margin: 0 }}>Live Poll Preview</h4>
    </div>
    <div className="card-body">
      <h5 style={{ marginBottom: 8 }}>{title || <span style={{ color: '#bbb' }}>[Poll Title]</span>}</h5>
      <p style={{ color: '#666', marginBottom: 16 }}>{description || <span style={{ color: '#ccc' }}>[Poll Description]</span>}</p>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {options && options.length > 0 ? (
          options.map((opt, i) => (
            <li key={i} style={{ marginBottom: 6, color: opt ? '#222' : '#bbb' }}>
              {opt || '[Option]'}
            </li>
          ))
        ) : (
          <li style={{ color: '#bbb' }}>[Options will appear here]</li>
        )}
      </ul>
    </div>
  </div>
);

// Helper to generate a unique ID
const generateId = () => 'poll-' + Math.random().toString(36).substr(2, 9);

// --- Main Component ---
const CreatePoll = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { token } = useContext(AuthContext);

  // Handle template selection
  const handleTemplateSelect = (setValues, template) => {
    setSelectedTemplate(template.name);
    setValues({
      title: template.data.title,
      description: template.data.description,
      options: template.data.options,
    });
  };

  // Save poll to localStorage (mock mode)
  const savePollToLocal = (values) => {
    const newPoll = {
      _id: generateId(),
      title: values.title,
      description: values.description,
      options: values.options.map(opt => ({ text: opt, votes: 0 })),
      createdBy: 'TestUser',
      createdAt: new Date().toISOString(),
      totalVotes: 0
    };
    const existing = JSON.parse(localStorage.getItem('mockPolls') || '[]');
    localStorage.setItem('mockPolls', JSON.stringify([newPoll, ...existing]));
    return newPoll;
  };

  // Create poll in backend
  const createPoll = async (values) => {
    try {
      const pollData = {
        title: values.title,
        description: values.description,
        options: values.options.map(opt => ({ text: opt })),
      };
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.post(`${API_URL}/polls`, pollData, config);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="create-poll-page" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2>Create a New Poll</h2>
        <p>Ask a question and define options for people to vote on</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success text-center" style={{ marginBottom: 24 }}>
          <h3>Poll Created Successfully!</h3>
          <p>Your poll has been created and is now available for voting.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error text-center" style={{ marginBottom: 24 }}>{error}</div>
      )}

      {/* Quick Start with Templates */}
      <div className="card mb-4" style={{ marginBottom: 32 }}>
        <div className="card-header bg-light">
          <h3 className="text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaLightbulb className="mr-2" size={18} style={{ marginRight: 8 }} />
            Quick Start with Templates
          </h3>
        </div>
        <div className="card-body">
          <p className="text-center mb-3">Choose a template to quickly create a poll:</p>
          <div className="template-grid" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {pollTemplates.map((template) => (
              <div
                className={`template-card${selectedTemplate === template.name ? ' selected' : ''}`}
                key={template.name}
                style={{
                  border: selectedTemplate === template.name ? '2px solid #8a2be2' : '1px solid #eee',
                  borderRadius: 12,
                  padding: 20,
                  minWidth: 200,
                  background: '#fff',
                  cursor: 'pointer',
                  boxShadow: selectedTemplate === template.name ? '0 2px 12px #8a2be233' : '0 1px 4px #0001',
                  transition: 'all 0.2s',
                }}
                onClick={() => {}}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{template.icon}</div>
                <h4 style={{ margin: 0 }}>{template.name}</h4>
                <p style={{ fontSize: 14, color: '#666', margin: '8px 0 0 0' }}>{template.data.title}</p>
                <Formik initialValues={defaultInitialValues} onSubmit={() => {}}>
                  {({ setValues }) => (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: 12, width: '100%' }}
                      onClick={() => handleTemplateSelect(setValues, template)}
                    >
                      Use Template
                    </button>
                  )}
                </Formik>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Poll Creation Form + Live Preview Side by Side on Desktop */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                <FaQuestion size={18} className="mr-2" style={{ marginRight: 8 }} />
                Poll Details
              </h3>
            </div>
            <div className="card-body">
              <Formik
                initialValues={defaultInitialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                  setError(null);
                  setSuccess(false);
                  try {
                    // Try to create poll via API (if available)
                    let pollCreated = false;
                    try {
                      await createPoll(values);
                      pollCreated = true;
                    } catch (apiErr) {
                      // If API fails, fallback to localStorage
                      pollCreated = false;
                    }
                    if (!pollCreated) {
                      savePollToLocal(values);
                    }
                    setSuccess(true);
                    resetForm();
                    setTimeout(() => {
                      setSuccess(false);
                      navigate('/');
                    }, 2000);
                  } catch (err) {
                    setError('Failed to create poll. Please try again.');
                  }
                  setSubmitting(false);
                }}
                enableReinitialize={!!selectedTemplate}
              >
                {({ values, isSubmitting, setValues }) => (
                  <Form>
                    <div className="form-group">
                      <label htmlFor="title" className="form-label">Poll Title</label>
                      <Field
                        type="text"
                        id="title"
                        name="title"
                        className="form-control"
                        placeholder="Enter a question or title for your poll"
                      />
                      <ErrorMessage name="title" component="div" className="form-error" />
                    </div>

                    <div className="form-group">
                      <label htmlFor="description" className="form-label">Description</label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        className="form-control"
                        placeholder="Provide more details about your poll"
                        rows="3"
                      />
                      <ErrorMessage name="description" component="div" className="form-error" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Options</label>
                      <FieldArray name="options">
                        {({ push, remove, move }) => (
                          <>
                            <div>
                              {values.options.map((option, index) => (
                                <div key={index} className="option-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                  <Field
                                    type="text"
                                    name={`options.${index}`}
                                    className="form-control"
                                    placeholder={`Option ${index + 1}`}
                                    style={{ flex: 1, marginRight: 8 }}
                                  />
                                  {/* Option reordering buttons */}
                                  <div style={{ display: 'flex', flexDirection: 'column', marginRight: 8 }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      style={{ padding: 2, marginBottom: 2, background: 'none', border: 'none', cursor: 'pointer' }}
                                      onClick={() => index > 0 && move(index, index - 1)}
                                      disabled={index === 0}
                                      title="Move up"
                                    >
                                      <FaArrowUp />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer' }}
                                      onClick={() => index < values.options.length - 1 && move(index, index + 1)}
                                      disabled={index === values.options.length - 1}
                                      title="Move down"
                                    >
                                      <FaArrowDown />
                                    </button>
                                  </div>
                                  {values.options.length > 2 && (
                                    <button
                                      type="button"
                                      className="btn-option-remove"
                                      style={{ marginLeft: 4 }}
                                      onClick={() => remove(index)}
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                  <ErrorMessage
                                    name={`options.${index}`}
                                    component="div"
                                    className="form-error"
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline mt-2"
                              onClick={() => push('')}
                              style={{ marginTop: 8 }}
                            >
                              <FaPlus size={12} />
                              <span className="ml-1">Add Option</span>
                            </button>
                          </>
                        )}
                      </FieldArray>
                      <ErrorMessage name="options" component="div" className="form-error" />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-block mt-4"
                      disabled={isSubmitting}
                      style={{ width: '100%', marginTop: 24 }}
                    >
                      {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
        {/* Live Preview */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <PollPreview
            title={selectedTemplate ? pollTemplates.find(t => t.name === selectedTemplate)?.data.title : undefined}
            description={selectedTemplate ? pollTemplates.find(t => t.name === selectedTemplate)?.data.description : undefined}
            options={selectedTemplate ? pollTemplates.find(t => t.name === selectedTemplate)?.data.options : undefined}
          />
          <Formik initialValues={defaultInitialValues} enableReinitialize={!!selectedTemplate}>
            {({ values }) => (
              <PollPreview
                title={values.title}
                description={values.description}
                options={values.options}
              />
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll; 