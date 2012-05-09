require 'sinatra'
require 'rack/contrib'
require './server'

use Rack::JSONP

root=Dir.pwd
puts ">>> Serving: #{root}/../"

run Rack::Directory.new("#{root}/../")

map "/poller" do
  run Sinatra::Application
end

