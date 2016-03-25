// ===========
// Controllers
// ===========
EventController = RouteController.extend({
  // TODO add 404 checker in a after-data-first-time-request hook
  // TODO handle deleted events (when the user is currently viewing)
  data: function() {
    const event = Events.findOne({_id: this.params.event_id});
    if (!event) { console.log("No event found"); }
    event.isOwner = ownsEvent(Meteor.userId(), event);

    // calculate remaining tickets
    if (event.tickets) {
      for (let ticket of event.tickets) {
        ticket.remaining = ticket.total - (ticket.sold || []).length;
      }
    }
    event.tickets = new ReactiveVar(event.tickets || []);

    return event;
  }
});

ModifyEventController = EventController.extend({
  onBeforeAction: function() {
    // Check for ownership permissions
    // NOTE: this will also reject unauthenticated users (yay)
    if (!ownsEvent(Meteor.userId(), this.data())) {
      this.render("insufficient_permissions");
      throw new Meteor.Error("insufficient_permissions", "user not authorized to edit this event");
    }
    this.next();
  }
});

EventListController = RouteController.extend({
  // NOTE: this is currently not in use (and can't be reached - array at root)
  // check event_listing.js for Template helper
  // data: function() {
  //   return Events.find({});
  // },
  template: "event_listing"
});

// ======
// Routes
// ======
Router.route("/events/", {
  controller: EventListController
});

Router.route("/events/new", {
  template: "edit_event",
  data: function() {
    // TODO seed the dates/get a better date picker
    return {
      new_event: true,
    };
  },
  onBeforeAction: function() {
    if (!Meteor.user()) {
      this.render("insufficient_permissions");
    } else {
      this.next();
    }
  }
});

Router.route("/events/:event_id", {
  controller: EventController,
  template: "view_event"
});

Router.route("/events/:event_id/edit", {
  controller: ModifyEventController,
  template: "edit_event"
});

Router.route("/events/:event_id/manage", {
  controller: ModifyEventController,
  template: "manage_event"
});
