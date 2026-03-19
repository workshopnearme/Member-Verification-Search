jQuery(document).ready(function($) {
    // Check if URL has id parameter for direct verification
    function checkUrlParameter() {
        var urlParams = new URLSearchParams(window.location.search);
        var idFromUrl = urlParams.get('id');
        
        if (idFromUrl) {
            $('#id_number').val(idFromUrl);
            // Trigger search after a short delay to ensure form is ready
            setTimeout(function() {
                searchMember(idFromUrl);
            }, 300);
        }
    }
    
    // Check URL parameter on page load
    checkUrlParameter();
    
    $('#member-search-form').on('submit', function(e) {
        e.preventDefault();
        
        var idNumber = $('#id_number').val().trim();
        
        if (!idNumber) {
            showResult('error', 'Please enter an ID number.');
            return;
        }
        
        searchMember(idNumber);
    });
    
    function searchMember(idNumber) {
        $('#mvs-result').hide();
        $('#mvs-loading').show();
        
        $.ajax({
            url: memberSearch.ajax_url,
            type: 'POST',
            data: {
                action: 'search_member',
                nonce: memberSearch.nonce,
                id_number: idNumber
            },
            success: function(response) {
                $('#mvs-loading').hide();
                
                if (response.success) {
                    var data = response.data;
                    displayMembershipCard(data);
                } else {
                    showResult('error', '<h4><span class="mvs-result-icon">✗</span> Not Found</h4><p>' + response.data.message + '</p>');
                }
            },
            error: function() {
                $('#mvs-loading').hide();
                showResult('error', '<h4><span class="mvs-result-icon">✗</span> Error</h4><p>An error occurred. Please try again.</p>');
            }
        });
    }
    
    function displayMembershipCard(data) {
        // Store data globally for PDF generation
        window.currentMemberData = data;
        
        var html = '<div class="mvs-membership-card" id="membership-card">';
        
        // Header Section
        html += '<div class="mvs-card-header">';
        html += '<div class="mvs-header-content">';
        html += '<div class="mvs-card-avatar">';
        html += '<img src="' + data.avatar + '" alt="Member Photo" />';
        html += '</div>';
        html += '<div class="mvs-header-info">';
        html += '<h2 class="mvs-card-name">' + data.name + '</h2>';
        html += '<div class="mvs-card-id">ID: ' + data.id_number + '</div>';
        html += '<div class="mvs-card-status-badge">' + data.status + '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // Contact Section
        html += '<div class="mvs-card-section">';
        html += '<h3 class="mvs-section-title">Contact Information</h3>';
        html += '<div class="mvs-contact-grid">';
        html += '<div class="mvs-contact-item">';
        html += '<div class="mvs-contact-icon">✉️</div>';
        html += '<div class="mvs-contact-details">';
        html += '<div class="mvs-contact-label">Email</div>';
        html += '<div class="mvs-contact-value">' + data.email + '</div>';
        html += '</div>';
        html += '</div>';
        if (data.phone) {
            html += '<div class="mvs-contact-item">';
            html += '<div class="mvs-contact-icon">📱</div>';
            html += '<div class="mvs-contact-details">';
            html += '<div class="mvs-contact-label">Phone</div>';
            html += '<div class="mvs-contact-value">' + data.phone + '</div>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        
        // Education Section
        if (data.education && Object.keys(data.education).length > 0) {
            html += '<div class="mvs-card-section">';
            html += '<h3 class="mvs-section-title">Education Timeline</h3>';
            html += '<div class="mvs-education-timeline">';
            
            var educationOrder = ['diploma', 'degree', 'master', 'phd'];
            var educationLabels = {
                'diploma': 'Diploma',
                'degree': 'Degree',
                'master': 'Master',
                'phd': 'PhD'
            };
            
            for (var i = 0; i < educationOrder.length; i++) {
                var level = educationOrder[i];
                if (data.education[level]) {
                    var edu = data.education[level];
                    html += '<div class="mvs-education-item">';
                    html += '<div class="mvs-education-marker"></div>';
                    html += '<div class="mvs-education-content">';
                    html += '<div class="mvs-education-level">' + educationLabels[level] + '</div>';
                    html += '<div class="mvs-education-title">' + edu.title + '</div>';
                    html += '<div class="mvs-education-years">' + edu.enroll_year + ' - ' + edu.graduate_year + '</div>';
                    html += '</div>';
                    html += '</div>';
                }
            }
            
            html += '</div>';
            html += '</div>';
        }
        
        // Member Info Section
        html += '<div class="mvs-card-section">';
        html += '<div class="mvs-info-grid">';
        html += '<div class="mvs-info-item">';
        html += '<div class="mvs-info-label">Member Since</div>';
        html += '<div class="mvs-info-value">' + data.member_since + '</div>';
        html += '</div>';
        html += '<div class="mvs-info-item">';
        html += '<div class="mvs-info-label">Registered</div>';
        html += '<div class="mvs-info-value">' + data.registered + '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        
        // Action Buttons
        html += '<div class="mvs-action-section">';
        html += '<button id="save-contact-btn" class="mvs-action-btn mvs-btn-primary">';
        html += '<span class="mvs-btn-icon">📇</span> Save to Phone';
        html += '</button>';
        html += '<button id="download-pdf-btn" class="mvs-action-btn mvs-btn-secondary">';
        html += '<span class="mvs-btn-icon">📥</span> Download PDF';
        html += '</button>';
        html += '</div>';
        
        showResult('success', html);
        
        // Event handlers
        $('#save-contact-btn').on('click', function() {
            saveToPhone(data);
        });
        
        $('#download-pdf-btn').on('click', function() {
            downloadMembershipCardPDF();
        });
    }
    
    function saveToPhone(data) {
        // Create vCard
        var vcard = 'BEGIN:VCARD\n';
        vcard += 'VERSION:3.0\n';
        vcard += 'FN:' + data.name + '\n';
        vcard += 'EMAIL:' + data.email + '\n';
        if (data.phone) {
            vcard += 'TEL:' + data.phone + '\n';
        }
        vcard += 'NOTE:Alumni UiTM Sabah - Member ID: ' + data.id_number + '\n';
        vcard += 'END:VCARD';
        
        // Create download link
        var blob = new Blob([vcard], { type: 'text/vcard' });
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = data.name.replace(/\s+/g, '_') + '.vcf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
    
    function downloadMembershipCardPDF() {
        var button = $('#download-pdf-btn');
        var originalText = button.html();
        button.html('⏳ Generating PDF...').prop('disabled', true);
        
        var data = window.currentMemberData;
        var verificationUrl = memberSearch.page_url + '?id=' + encodeURIComponent(data.id_number);
        
        // Create temporary QR code container
        var qrContainer = $('<div id="temp-qr-container" style="position:absolute;left:-9999px;"></div>');
        $('body').append(qrContainer);
        
        // Generate QR code
        var qrCode = new QRCode(qrContainer[0], {
            text: verificationUrl,
            width: 150,
            height: 150,
            colorDark: '#1f2937',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Wait for QR code to generate
        setTimeout(function() {
            var qrImage = qrContainer.find('img')[0];
            
            var card = document.getElementById('membership-card');
            
            html2canvas(card, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            }).then(function(canvas) {
                var imgData = canvas.toDataURL('image/png');
                var imgWidth = 190;
                var imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                const { jsPDF } = window.jspdf;
                var pdf = new jsPDF('p', 'mm', 'a4');
                
                var pageWidth = pdf.internal.pageSize.getWidth();
                var x = (pageWidth - imgWidth) / 2;
                var y = 20;
                
                // Add membership card
                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                
                // Add QR code below the card
                var qrSize = 40;
                var qrX = (pageWidth - qrSize) / 2;
                var qrY = y + imgHeight + 10;
                
                pdf.addImage(qrImage.src, 'PNG', qrX, qrY, qrSize, qrSize);
                
                // Add QR label
                pdf.setFontSize(10);
                pdf.setTextColor(31, 41, 55);
                pdf.text('Scan to Verify', pageWidth / 2, qrY + qrSize + 7, { align: 'center' });
                
                var idNumber = data.id_number;
                pdf.save('membership-card-' + idNumber + '.pdf');
                
                // Clean up
                qrContainer.remove();
                button.html(originalText).prop('disabled', false);
            }).catch(function(error) {
                console.error('Error generating PDF:', error);
                qrContainer.remove();
                button.html(originalText).prop('disabled', false);
                alert('Error generating PDF. Please try again.');
            });
        }, 500);
    }
    
    function showResult(type, content) {
        var $result = $('#mvs-result');
        $result.removeClass('success error').addClass(type);
        $result.html(content);
        $result.show();
    }
});
