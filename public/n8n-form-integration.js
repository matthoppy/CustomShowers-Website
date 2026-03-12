// Custom Showers - N8N Form Integration
// This script submits the contact form to n8n webhook

(function() {
  'use strict';
  
  const N8N_WEBHOOK_URL = 'https://n8n.customshowers.uk/webhook/559679be-1229-49a4-bf99-28e3f5a124b7';
  
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const sendButton = document.querySelector('button[type="submit"]');
    
    if (!form) {
      console.error('Form not found');
      return;
    }
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Show loading state
      const originalText = sendButton ? sendButton.textContent : 'Send Message';
      if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
      }
      
      // Gather form data
      const formData = new FormData(form);
      const serviceType = formData.get('serviceType') || 'Supply Only';
      
      const payload = {
        timestamp: new Date().toISOString(),
        source: 'customshowers.uk',
body: {
          name: formData.get('name') || '',
          phone: formData.get('phone') || '',
          email: formData.get('email') || '',
          serviceType: serviceType,
          address: {
            line: formData.get('addressLine') || '',
            city: formData.get('city') || '',
            postcode: formData.get('postcode') || ''
          },
          message: formData.get('message') || ''
        },
        // HubSpot compatible fields
        firstname: (formData.get('name') || '').split(' ')[0],
        lastname: (formData.get('name') || '').split(' ').slice(1).join(' '),
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        address: `${formData.get('addressLine') || ''}, ${formData.get('city') || ''}, ${formData.get('postcode') || ''}`,
        zip: formData.get('postcode') || ''
      };
      
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          // Show success message
          const successHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #f0fdf4; border-radius: 12px; border: 1px solid #86efac;">
              <div style="font-size: 64px; margin-bottom: 24px;">✓</div>
              <h3 style="font-size: 28px; margin-bottom: 12px; color: #166534; font-weight: 600;">Message Sent!</h3>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for your enquiry. We'll be in touch within 24 hours.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
                A copy has been sent to ${payload.customer.email}
              </p>
            </div>
          `;
          
          form.innerHTML = successHTML;
          
          // Scroll to success message
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error('Server returned ' + response.status);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        
        if (sendButton) {
          sendButton.disabled = false;
          sendButton.textContent = originalText;
        }
        
        alert('Sorry, there was an error sending your message. Please try again or email us directly at sales@customshowers.uk');
      }
    });
  });
})();
