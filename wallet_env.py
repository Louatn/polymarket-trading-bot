class wallet_env:
    def __init__(self, initial_value):
        self.value = initial_value

    def update_value(self, new_value):
        self.value = new_value

    def get_value(self):
        return self.value