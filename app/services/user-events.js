import Ember from 'ember';
import config from 'ilios/config/environment';
import EventMixin from 'ilios/mixins/events';
import ajax from 'ic-ajax';
import moment from 'moment';

export default Ember.Service.extend(EventMixin, {
  store: Ember.inject.service(),
  currentUser: Ember.inject.service(),
  getEvents(from, to){
    var deferred = Ember.RSVP.defer();
    this.get('currentUser.model').then(user => {
      if( user ){
        var url = '/' + config.adapterNamespace + '/userevents/' +
        user.get('id') + '?from=' + from + '&to=' + to;
        ajax(url).then(data => {
          let events = data.userEvents.sortBy('startDate').map(event => {
            event.slug = this.getSlugForEvent(event);
            
            return event;
          });
          
          deferred.resolve(events);
        });
      } else {
        deferred.resolve([]);
      }

    });

    return deferred.promise;
  },
  getEventForSlug(slug){
    let from = moment(slug.substring(1, 9), 'YYYYMMDD').hour(0);
    let to = from.clone().hour(24);
    let type = slug.substring(9, 10);
    let id = parseInt(slug.substring(10));
    
    return new Ember.RSVP.Promise(resolved => {
      this.getEvents(from.unix(), to.unix()).then(events => {
        let event = events.find( event => {
          if(type === 'O'){
            return event.offering === id;
          }
          if(type === 'I'){
            return event.ilmSession === id;
          }
        });
        
        resolved(event);
      });
    });
    
   
  },
  getSlugForEvent(event){
    let slug = 'U';
    slug += moment(event.startDate).format('YYYYMMDD');
    if(event.offering){
      slug += 'O' + event.offering;
    }
    if(event.ilmSession){
      slug += 'I' + event.ilmSession;
    }

    return slug;
  },
});