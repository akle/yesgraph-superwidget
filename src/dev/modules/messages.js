export default function MessageManager(messageSection) {
    var self = this;

    this.message = function(msg, type, duration) {
        var flashDiv = $("<div>", {
            "class": "yes-flash yes-flash-" + type,
            "text": msg || ""
        });
        messageSection.append(flashDiv.hide());
        flashDiv.show(300);

        window.setTimeout(function () {
            flashDiv.hide(300, function () {
                $(this).remove();
            });
        }, duration || 3500);
    };

    this.success = function(msg, duration) {
        msg = msg || "Success!";
        self.message(msg, "success", duration);
    };

    this.error = function(msg, duration) {
        msg = "Error: " + (msg || "Something went wrong.");
        self.message(msg, "error", duration);
    };
}
