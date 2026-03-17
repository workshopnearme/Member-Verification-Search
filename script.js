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
        html += '<div class="mvs-card-header">';
        html += '<div class="mvs-card-logo">🎫</div>';
        html += '<h2>MEMBERSHIP CARD</h2>';
        html += '</div>';
        html += '<div class="mvs-card-body">';
        html += '<div class="mvs-card-avatar">';
        html += '<img src="' + data.avatar + '" alt="Member Photo" />';
        html += '</div>';
        html += '<div class="mvs-card-info">';
        html += '<div class="mvs-card-name">' + data.name + '</div>';
        html += '<div class="mvs-card-field"><span class="mvs-card-label">ID Number:</span> <span class="mvs-card-value">' + data.id_number + '</span></div>';
        html += '<div class="mvs-card-field"><span class="mvs-card-label">Email:</span> <span class="mvs-card-value">' + data.email + '</span></div>';
        html += '<div class="mvs-card-field"><span class="mvs-card-label">Member Since:</span> <span class="mvs-card-value">' + data.member_since + '</span></div>';
        html += '<div class="mvs-card-field"><span class="mvs-card-label">Status:</span> <span class="mvs-card-status">' + data.status + '</span></div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="mvs-card-footer">';
        html += '<div class="mvs-card-date">Valid from: ' + data.registered + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="mvs-download-section">';
        html += '<button id="download-pdf-btn" class="mvs-download-btn">📥 Download as PDF</button>';
        html += '</div>';
        
        showResult('success', html);
        
        $('#download-pdf-btn').on('click', function() {
            downloadMembershipCardPDF();
        });
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
