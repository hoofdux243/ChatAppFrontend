// Clean version of updateUserStatus function
import { useCallback } from 'react';

export const createUpdateUserStatus = (setConversations) => {
  return useCallback((userStatus) => {
    console.log('=== UPDATE USER STATUS START ===');
    console.log('UserStatus data:', userStatus);
    
    setConversations(prevConversations => {
      console.log('=== INSIDE SETCONVERSATIONS CALLBACK ===');
      console.log('Previous conversations count:', prevConversations.length);
      
      if (!userStatus || !userStatus.id) {
        console.log('❌ Invalid userStatus, returning unchanged');
        return prevConversations;
      }
      
      const updatedConversations = prevConversations.map(conversation => {
        console.log('Checking conversation:', conversation.title, 'memberId:', conversation.memberId, 'roomType:', conversation.roomType);
        
        if (conversation.roomType === 'PRIVATE' && conversation.memberId === userStatus.id) {
          console.log('✅ FOUND MATCH! Updating conversation:', conversation.title);
          const updated = {
            ...conversation,
            isOnline: userStatus.online,
            lastSeen: userStatus.lastSeen
          };
          console.log('Updated conversation status:', updated.isOnline);
          return updated;
        }
        
        return conversation;
      });
      
      console.log('=== SETCONVERSATIONS CALLBACK COMPLETE ===');
      return updatedConversations;
    });
    
    console.log('=== UPDATE USER STATUS END ===');
  }, [setConversations]);
};