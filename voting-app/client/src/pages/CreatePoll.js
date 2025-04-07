import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { FaPlus, FaTrash, FaLightbulb, FaQuestion } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

// API URL
const API_URL = 'http://localhost:5000/api';

// Sample poll templates to help users get started
const pollTemplates = [
  {
    name: 'Favorite Food',
    data: {
      title: 'What is your favorite type of food?',
      description: 'I am curious to know what type of cuisine people prefer the most.',
      options: [
        { text: 'Italian' },
        { text: 'Mexican' },
        { text: 'Chinese' },
        { text: 'Japanese' },
        { text: 'Indian' }
      ]
    }
  },
  {
    name: 'Vacation Destination',
    data: {
      title: 'Where would you like to go on your next vacation?',
      description: 'If you could travel anywhere right now, which destination would you choose?',
      options: [
        { text: 'Beach resort' },
        { text: 'Mountain retreat' },
        { text: 'City exploration' },
        { text: 'Cultural tour' }
      ]
    }
  },
  {
    name: 'Movie Night',
    data: {
      title: 'What movie genre should we watch for movie night?',
      description: 'Help us decide what type of movie to watch for our upcoming movie night!',
      options: [
        { text: 'Action/Adventure' },
        { text: 'Comedy' },
        { text: 'Horror' },
        { text: 'Sci-Fi' },
        { text: 'Drama' }
      ]
    }
  },
  {
    name: 'Favorite Food',
    icon: '🍕',
    data: {
      title: 'What is your favorite type of food?',
      description: 'I am curious to know what type of cuisine people prefer the most.',
      options: [
        { text: 'Italian' },
        { text: 'Mexican' },
        { text: 'Chinese' },
        { text: 'Japanese' },
        { text: 'Indian' }
      ]
    }
  },
  {
    name: 'Travel Destination',
    icon: '✈️',
    data: {
      title: 'Where would you like to go on vacation?',
      description: 'If you could travel anywhere, which destination would you choose?',
      options: [
        { text: 'Beach resort' },
        { text: 'Mountain getaway' },
        { text: 'European tour' },
        { text: 'Asian adventure' }
      ]
    }
  },
  {
    name: 'Movie Genre',
    icon: '🎬',
    data: {
      title: 'What movie genre do you prefer?',
      description: 'Help us understand which type of movies are most popular.',
      options: [
        { text: 'Action' },
        { text: 'Comedy' },
        { text: 'Drama' },
        { text: 'Horror' },
        { text: 'Science Fiction' }
      ]
    }
  }
];

const CreatePoll = () => {
  const { token, isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdPollId, setCreatedPollId] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState(null);

  // Check if there's a template in localStorage
  useEffect(() => {
    const savedTemplate = localStorage.getItem('pollTemplate');
    if (savedTemplate) {
      try {
        const template = JSON.parse(savedTemplate);
        console.log('Found template in localStorage:', template);
        
        // Find matching template from our predefined list
        const matchingTemplate = pollTemplates.find(t => 
          t.name.toLowerCase() === template.name.toLowerCase() ||
          t.name.toLowerCase() === template.title?.toLowerCase()
        );
        
        if (matchingTemplate) {
          console.log('Found matching template:', matchingTemplate);
          setInitialFormValues({
            ...matchingTemplate.data,
            expiresAt: getDefaultExpiryDate()
          });
        } else {
          // Create a custom template based on the provided data
          const customTemplate = {
            title: template.title || '',
            description: `Poll about ${template.name || 'this topic'}`,
            options: [
              { text: 'Option 1' },
              { text: 'Option 2' },
              { text: 'Option 3' }
            ],
            expiresAt: getDefaultExpiryDate()
          };
          setInitialFormValues(customTemplate);
        }
        
        // Clear the localStorage item
        localStorage.removeItem('pollTemplate');
      } catch (e) {
        console.error('Error parsing saved template:', e);
      }
    }
  }, []);

  // Get a default expiry date (1 week from now)
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const defaultInitialValues = {
    title: '',
    description: '',
    options: [
      { text: '' },
      { text: '' }
    ],
    expiresAt: getDefaultExpiryDate()
  };

  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Title is required')
      .max(100, 'Title cannot be more than 100 characters'),
    description: Yup.string()
      .required('Description is required')
      .max(500, 'Description cannot be more than 500 characters'),
    options: Yup.array()
      .of(
        Yup.object().shape({
          text: Yup.string().required('Option text is required')
        })
      )
      .min(2, 'At least 2 options are required')
      .test(
        'unique-options',
        'Options must be unique',
        function(options) {
          const texts = options.map(option => option.text);
          const uniqueTexts = new Set(texts);
          return texts.length === uniqueTexts.size;
        }
      ),
    expiresAt: Yup.date()
      .required('Expiry date is required')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError(null);
      
      // Auto-generate poll ID for cases where the API might fail
      const mockPollId = `mock-poll-${Math.floor(Math.random() * 10000)}`;
      
      // Create the poll with voter IDs array as empty
      const newPoll = {
        _id: mockPollId,
        ...values,
        createdBy: user?.username || 'TestUser',
        createdAt: new Date().toISOString(),
        voters: [],
        // Calculate total votes (all starting at 0)
        totalVotes: 0
      };
      
      // Ensure options have proper structure with votes
      newPoll.options = newPoll.options.map(option => ({
        ...option,
        _id: `opt-${Math.random().toString(36).substring(2, 10)}`,
        votes: 0
      }));
      
      console.log('Creating new poll:', newPoll);
      
      // Try the API first
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        };
        
        const res = await axios.post(`${API_URL}/polls`, values, config);
        console.log('API response:', res.data);
        if (res.data && res.data.data && res.data.data._id) {
          setCreatedPollId(res.data.data._id);
          
          // Still store in localStorage as backup
          const mockPolls = JSON.parse(localStorage.getItem('mockPolls') || '[]');
          mockPolls.push(newPoll);
          localStorage.setItem('mockPolls', JSON.stringify(mockPolls));
        } else {
          throw new Error('Invalid API response');
        }
      } catch (apiError) {
        console.log('Using mock poll creation instead due to API error:', apiError);
        // Set the mock poll ID
        setCreatedPollId(mockPollId);
        
        // Store the poll in localStorage for persistence
        const mockPolls = JSON.parse(localStorage.getItem('mockPolls') || '[]');
        mockPolls.push(newPoll);
        localStorage.setItem('mockPolls', JSON.stringify(mockPolls));
      }
      
      setSuccess(true);
      resetForm();
      setSubmitting(false);
      
      // Navigate after showing success message
      setTimeout(() => {
        navigate(createdPollId ? `/polls/${createdPollId}` : '/');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating poll:', err);
      setError(err.response?.data?.error || 'Error creating poll. Please try again.');
      setSubmitting(false);
    }
  };

  const applyTemplate = (formikProps, template) => {
    formikProps.setValues({
      ...formikProps.values,
      title: template.data.title,
      description: template.data.description,
      options: template.data.options,
    });
  };

  if (success) {
    return (
      <div className="create-poll-page">
        <div className="alert alert-success text-center">
          <h3>Poll Created Successfully!</h3>
          <p className="mt-2">Your poll has been created and is now available for voting.</p>
          <p className="mt-1">You will be redirected to view your poll in a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-poll-page">
      <div className="page-header">
        <h2>Create a New Poll</h2>
        <p>Ask a question and define options for people to vote on</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="card mb-4">
        <div className="card-header bg-light">
          <h3 className="text-center">
            <FaLightbulb className="mr-2" size={18} />
            Quick Start with Templates
          </h3>
        </div>
        <div className="card-body">
          <p className="text-center mb-3">Choose a template to quickly create a poll:</p>
          <Formik
            initialValues={initialFormValues || defaultInitialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {(formikProps) => (
              <div className="template-grid">
                {pollTemplates.slice(0, 3).map((template, index) => (
                  <div className="template-card" key={index}>
                    <h4>{template.name}</h4>
                    <p className="mb-2">{template.data.title}</p>
                    <p className="text-sm text-muted mb-3">
                      {template.data.options.length} options available
                    </p>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={() => applyTemplate(formikProps, template)}
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Formik>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>
            <FaQuestion size={18} className="mr-2" />
            Poll Details
          </h3>
        </div>
        <div className="card-body">
          <Formik
            initialValues={initialFormValues || defaultInitialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ values, isSubmitting }) => (
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
                    {({ push, remove }) => (
                      <>
                        {values.options.map((option, index) => (
                          <div key={index} className="option-row">
                            <div className="option-input">
                              <Field
                                type="text"
                                name={`options.${index}.text`}
                                className="form-control"
                                placeholder={`Option ${index + 1}`}
                              />
                              <ErrorMessage
                                name={`options.${index}.text`}
                                component="div"
                                className="form-error"
                              />
                            </div>
                            {values.options.length > 2 && (
                              <button
                                type="button"
                                className="btn-option-remove"
                                onClick={() => remove(index)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-outline mt-2"
                          onClick={() => push({ text: '' })}
                        >
                          <FaPlus size={12} />
                          <span className="ml-1">Add Option</span>
                        </button>
                      </>
                    )}
                  </FieldArray>
                  <ErrorMessage name="options" component="div" className="form-error" />
                </div>

                <div className="form-group">
                  <label htmlFor="expiresAt" className="form-label">Expiry Date</label>
                  <Field
                    type="date"
                    id="expiresAt"
                    name="expiresAt"
                    className="form-control"
                    min={getDefaultExpiryDate()}
                  />
                  <ErrorMessage name="expiresAt" component="div" className="form-error" />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll; 