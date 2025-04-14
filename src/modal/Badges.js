import { Modal } from './Modal'
import 'style/badges.scss'

const badgesHtml = `
<button class="button" id="cancel"><img src="/images/icon-x.svg"></button>
<div class="expandable modal-content badges-modal">
    <div class="expandable-inner">
        <h2>Your Badges Collection</h2>
        
        <!-- Empty state message at the top -->
        <div id="badges-empty-state">
            <p>You haven't earned any badges yet. Keep creating music!</p>
        </div>
        
        <!-- Earned badges section will be inserted here -->
        <div id="earned-badges-section"></div>
        
        <!-- Badges to earn section will be inserted here -->
        <div id="unearned-badges-section"></div>
        
        <button class="button" id="close-badges">Close</button>
    </div>
</div>
`

export class BadgesModal extends Modal {
    constructor(badgeSystem) {
        super(badgesHtml)
        
        this.badgeSystem = badgeSystem
        this.element.classList.add('badges-modal-container')
        
        // Add event listener for close button
        const closeButton = this.element.querySelector('#close-badges')
        closeButton.addEventListener('click', () => {
            this.close()
        })
        
        // Add event listener for the X button
        const cancelButton = this.element.querySelector('#cancel')
        cancelButton.addEventListener('click', () => {
            this.close()
        })
        
        // Render badges
        this.renderBadges()
    }
    
    renderBadges() {
        const earnedSection = this.element.querySelector('#earned-badges-section')
        const unearnedSection = this.element.querySelector('#unearned-badges-section')
        const emptyState = this.element.querySelector('#badges-empty-state')
        
        // Clear previous content
        earnedSection.innerHTML = ''
        unearnedSection.innerHTML = ''
        
        const earnedBadges = this.badgeSystem.getEarnedBadges()
        const allBadges = this.badgeSystem.getAllBadges()
        
        // Show/hide empty state message
        if (earnedBadges.length === 0) {
            emptyState.style.display = 'block'
        } else {
            emptyState.style.display = 'none'
        }
        
        // Create earned badges section at the top
        if (earnedBadges.length > 0) {
            const earnedHeader = document.createElement('h3')
            earnedHeader.textContent = 'Badges You\'ve Earned'
            earnedHeader.className = 'section-header'
            earnedSection.appendChild(earnedHeader)
            
            const badgesGrid = document.createElement('div')
            badgesGrid.className = 'badges-grid'
            
            // Add earned badges
            earnedBadges.forEach(badge => {
                const badgeEl = this.createBadgeElement(badge, false)
                badgesGrid.appendChild(badgeEl)
            })
            
            earnedSection.appendChild(badgesGrid)
        }
        
        // Create unearned badges section at the bottom
        const unearnedBadges = allBadges.filter(badge => 
            !earnedBadges.some(earned => earned.id === badge.id)
        )
        
        if (unearnedBadges.length > 0) {
            const unearnedHeader = document.createElement('h3')
            unearnedHeader.textContent = 'Badges to Earn'
            unearnedHeader.className = 'section-header'
            unearnedSection.appendChild(unearnedHeader)
            
            const badgesGrid = document.createElement('div')
            badgesGrid.className = 'badges-grid'
            
            // Add unearned badges
            unearnedBadges.forEach(badge => {
                const badgeEl = this.createBadgeElement(badge, true)
                badgesGrid.appendChild(badgeEl)
            })
            
            unearnedSection.appendChild(badgesGrid)
        }
    }
    
    createBadgeElement(badge, isUnearned) {
        const badgeEl = document.createElement('div')
        badgeEl.className = 'badge-item' + (isUnearned ? ' badge-unearned' : '')
        
        badgeEl.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-details">
                <h3>${badge.name}</h3>
                <p>${badge.description}</p>
            </div>
        `
        
        return badgeEl
    }
    
    close() {
        // Remove the modal from the DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element)
        }
        this.emit('cancel')
    }
}